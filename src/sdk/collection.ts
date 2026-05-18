import { GmailEngine } from '../core/engine.js';
import { cache } from '../core/cache.js';
import { randomUUID } from 'crypto';
import { syncCollection } from '../core/sync.js';
import { encrypt, decrypt } from '../core/encryption.js';
import { ValidationError, FileSizeError, NotFoundError } from '../core/errors.js';
import type {
  GmailDBDocument,
  InsertResult,
  InsertManyResult,
  DeleteResult,
  FindOptions,
  InsertOptions,
  UploadResult,
  FileResult,
} from '../types/index.js';
import dotenv from 'dotenv';
dotenv.config();

const SECRET = process.env.GMAILDB_SECRET || 'default_secret';

export class Collection {
  constructor(
    private name: string,
    private engine: GmailEngine
  ) {}

  /**
   * Insert a single document into the collection.
   * @param data - Plain object to store
   * @param options - Optional TTL in days
   * @returns Inserted document with generated _id and msgId
   */
  async insert(
    data: Record<string, any>,
    options?: { ttl?: number }
  ): Promise<{ id: string; msgId: string; data: Record<string, any> }> {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new ValidationError('insert() requires a plain object.');
    }
    if (Object.keys(data).length === 0) {
      throw new ValidationError('Cannot insert an empty object.');
    }

    const docId = randomUUID();
    const dataWithId = {
      ...data,
      _id: docId,
      ...(options?.ttl ? {
        _ttl: options.ttl,
        _expiresAt: new Date(Date.now() + options.ttl * 86400000).toISOString()
      } : {})
    };

    const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
    const encrypted = encrypt(JSON.stringify(dataWithId), SECRET);
    const msgId = await this.engine.insertMessage(labelId, `gmaildb:${this.name}`, encrypted);
    cache.set(msgId, this.name, dataWithId, options?.ttl);
    return { id: docId, msgId, data: dataWithId };
  }

  /**
   * Insert multiple documents at once.
   * @param docs - Array of plain objects to store
   * @returns Number of inserted documents and their IDs
   */
  async insertMany(docs: Record<string, any>[]): Promise<{ inserted: number; ids: string[] }> {
    if (!Array.isArray(docs) || docs.length === 0) {
      throw new ValidationError('insertMany() requires a non-empty array.');
    }

    const ids: string[] = [];
    for (const doc of docs) {
      if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
        throw new ValidationError('Each item in insertMany() must be a plain object.');
      }
      if (Object.keys(doc).length === 0) {
        throw new ValidationError('Cannot insert an empty object.');
      }
      const result = await this.insert(doc);
      ids.push(result.id);
    }

    return { inserted: docs.length, ids };
  }

  /**
   * Find all documents matching an optional filter.
   * @param filter - Optional filter object with query operators
   * @param options - Optional pagination, sorting
   * @returns Array of matching documents
   */
  async find(
    filter?: Record<string, any>,
    options?: { limit?: number; skip?: number; sort?: { field: string; order: 'asc' | 'desc' }; fields?: string[] }
  ): Promise<any[]> {
    await syncCollection(this.engine, this.name);
    let results = cache.find(this.name, filter);

    // Sort
    if (options?.sort) {
      const { field, order } = options.sort;
      results.sort((a, b) => {
        if (a[field] < b[field]) return order === 'asc' ? -1 : 1;
        if (a[field] > b[field]) return order === 'asc' ? 1 : -1;
        return 0;
      });
    }

    // Pagination
    const skip = options?.skip || 0;
    const limit = options?.limit;
    results = results.slice(skip);
    if (limit) results = results.slice(0, limit);

    // Field projection
    if (options?.fields && options.fields.length > 0) {
      results = results.map(doc => {
        const projected: Record<string, any> = { id: doc.id, _id: doc._id };
        for (const field of options.fields!) {
          if (field in doc) projected[field] = doc[field];
        }
        return projected;
      });
    }

    return results;
  }

  /**
   * Find a single document by its _id.
   * O(1) lookup — does not scan all records.
   * @param id - The _id of the document
   * @returns The document or throws NotFoundError
   */
  async findById(id: string): Promise<any> {
    if (!id || typeof id !== 'string') {
      throw new ValidationError('findById() requires a valid string ID.');
    }
    const doc = cache.getByDocId(id);
    if (!doc) throw new NotFoundError(this.name, { _id: id });
    return doc;
  }

  /**
   * Find a single document matching a filter.
   * @param filter - Filter object
   * @returns The first matching document or throws NotFoundError
   */
  async findOne(filter: Record<string, any>): Promise<any> {
    if (filter._id) {
      const doc = cache.getByDocId(filter._id);
      if (!doc) throw new NotFoundError(this.name, filter);
      return doc;
    }
    const results = await this.find(filter);
    if (!results.length) throw new NotFoundError(this.name, filter);
    return results[0];
  }

  /**
   * Check if a document matching the filter exists.
   * @param filter - Filter object
   * @returns true if exists, false otherwise
   */
  async exists(filter: Record<string, any>): Promise<boolean> {
    if (!filter || Object.keys(filter).length === 0) {
      throw new ValidationError('exists() requires a filter object.');
    }
    try {
      await this.findOne(filter);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Count documents matching an optional filter.
   * @param filter - Optional filter object
   * @returns Number of matching documents
   */
  async count(filter?: Record<string, any>): Promise<number> {
    await syncCollection(this.engine, this.name);
    return cache.find(this.name, filter).length;
  }

  /**
   * Get distinct values of a field.
   * @param field - Field name to get distinct values of
   * @param filter - Optional filter to apply before getting distinct values
   * @returns Array of unique values
   */
  async distinct(field: string, filter?: Record<string, any>): Promise<any[]> {
    if (!field || typeof field !== 'string') {
      throw new ValidationError('distinct() requires a field name.');
    }
    await syncCollection(this.engine, this.name);
    const docs = cache.find(this.name, filter);
    const values = docs.map(doc => doc[field]).filter(v => v !== undefined);
    return [...new Set(values)];
  }

  /**
   * Update documents matching a filter.
   * Uses O(1) lookup when filtering by _id.
   * @param filter - Filter to find documents
   * @param changes - Fields to update
   * @returns Number of updated documents
   */
  async update(filter: Record<string, any>, changes: Record<string, any>): Promise<number> {
    if (!filter || Object.keys(filter).length === 0) {
      throw new ValidationError('update() requires a filter object.');
    }
    if (!changes || Object.keys(changes).length === 0) {
      throw new ValidationError('update() requires a changes object.');
    }

    // Fast path — direct _id lookup
    if (filter._id) {
      const msgId = cache.getMsgIdByDocId(filter._id);
      if (!msgId) return 0;

      const full = await this.engine.getMessage(msgId);
      const body = this.engine.parseBody(full);
      let doc: any;
      try {
        doc = JSON.parse(decrypt(body, SECRET));
      } catch {
        doc = JSON.parse(body);
      }

      const newDoc = { ...doc, ...changes };
      await this.engine.trashMessage(msgId);
      cache.delete(msgId);
      const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
      const encrypted = encrypt(JSON.stringify(newDoc), SECRET);
      const newId = await this.engine.insertMessage(labelId, `gmaildb:${this.name}`, encrypted);
      cache.set(newId, this.name, newDoc);
      return 1;
    }

    // Slow path — full scan
    await syncCollection(this.engine, this.name);
    const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
    const messages = await this.engine.listMessages(labelId);
    let updated = 0;

    for (const msg of messages) {
      const full = await this.engine.getMessage(msg.id);
      const body = this.engine.parseBody(full);
      try {
        let doc: any;
        try {
          doc = JSON.parse(decrypt(body, SECRET));
        } catch {
          doc = JSON.parse(body);
        }
        if (this.matches(doc, filter)) {
          const newDoc = { ...doc, ...changes };
          await this.engine.trashMessage(msg.id);
          cache.delete(msg.id);
          const encrypted = encrypt(JSON.stringify(newDoc), SECRET);
          const newId = await this.engine.insertMessage(labelId, `gmaildb:${this.name}`, encrypted);
          cache.set(newId, this.name, newDoc);
          updated++;
        }
      } catch {}
    }
    return updated;
  }

  /**
   * Update multiple documents matching a filter.
   * @param filter - Filter to find documents
   * @param changes - Fields to update
   * @returns Number of updated documents
   */
  async updateMany(filter: Record<string, any>, changes: Record<string, any>): Promise<number> {
    return this.update(filter, changes);
  }

  /**
   * Delete a single document matching a filter or _id string.
   * Uses O(1) lookup when filtering by _id.
   * @param filter - Filter object or _id string
   */
  async deleteOne(filter: string | Record<string, any>): Promise<void> {
    const query = typeof filter === 'string' ? { _id: filter } : filter;

    // Fast path — direct _id lookup
    if (query._id) {
      const msgId = cache.getMsgIdByDocId(query._id);
      if (!msgId) throw new NotFoundError(this.name, query);
      await this.engine.trashMessage(msgId);
      cache.delete(msgId);
      return;
    }

    // Slow path — full scan
    await syncCollection(this.engine, this.name);
    const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
    const messages = await this.engine.listMessages(labelId);

    for (const msg of messages) {
      const full = await this.engine.getMessage(msg.id);
      const body = this.engine.parseBody(full);
      try {
        let doc: any;
        try {
          doc = JSON.parse(decrypt(body, SECRET));
        } catch {
          doc = JSON.parse(body);
        }
        if (this.matches(doc, query)) {
          await this.engine.trashMessage(msg.id);
          cache.delete(msg.id);
          return;
        }
      } catch {}
    }
    throw new NotFoundError(this.name, query);
  }

  /**
   * Delete multiple documents matching a filter.
   * @param filter - Filter object
   * @returns Number of deleted documents
   */
  async deleteMany(filter: Record<string, any>): Promise<{ deleted: number }> {
    if (!filter || Object.keys(filter).length === 0) {
      throw new ValidationError('deleteMany() requires a filter. To delete all use: deleteAll()');
    }

    await syncCollection(this.engine, this.name);
    const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
    const messages = await this.engine.listMessages(labelId);
    let deleted = 0;

    for (const msg of messages) {
      const full = await this.engine.getMessage(msg.id);
      const body = this.engine.parseBody(full);
      try {
        let doc: any;
        try {
          doc = JSON.parse(decrypt(body, SECRET));
        } catch {
          doc = JSON.parse(body);
        }
        if (this.matches(doc, filter)) {
          await this.engine.trashMessage(msg.id);
          cache.delete(msg.id);
          deleted++;
        }
      } catch {}
    }

    return { deleted };
  }

  /**
   * Delete all documents in the collection.
   * @returns Number of deleted documents
   */
  async deleteAll(): Promise<{ deleted: number }> {
    await syncCollection(this.engine, this.name);
    const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
    const messages = await this.engine.listMessages(labelId);
    let deleted = 0;

    for (const msg of messages) {
      await this.engine.trashMessage(msg.id);
      cache.delete(msg.id);
      deleted++;
    }

    return { deleted };
  }

  /**
   * Upload a file to Gmail as an attachment.
   * @param filename - Name of the file
   * @param fileBuffer - File contents as Buffer
   * @param mimeType - MIME type of the file
   * @returns Uploaded file ID and filename
   */
  async upload(filename: string, fileBuffer: Buffer, mimeType: string): Promise<{ id: string; filename: string }> {
    if (!filename || !mimeType) {
      throw new ValidationError('upload() requires filename and mimeType.');
    }
    const MAX_SIZE = 25 * 1024 * 1024;
    if (fileBuffer.length > MAX_SIZE) {
      throw new FileSizeError(filename, fileBuffer.length / (1024 * 1024));
    }

    const labelId = await this.engine.ensureLabel(`gmaildb/${this.name}`);
    const id = await this.engine.uploadFile(labelId, filename, mimeType, fileBuffer);
    const metadata = { filename, mimeType, uploadedAt: new Date().toISOString() };
    cache.set(id, this.name, metadata);
    return { id, filename };
  }

  /**
   * Download a file from Gmail by message ID.
   * @param messageId - Gmail message ID of the uploaded file
   * @returns File data, filename, and mimeType
   */
  async getFile(messageId: string): Promise<{ data: Buffer; filename: string; mimeType: string }> {
    if (!messageId) throw new ValidationError('getFile() requires a messageId.');
    return this.engine.getAttachment(messageId);
  }

  /**
   * Purge all expired records from local cache.
   * @returns Number of purged records
   */
  purgeExpired(): number {
    return cache.purgeExpired();
  }

  private matches(doc: any, filter: Record<string, any>): boolean {
    return Object.entries(filter).every(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        return Object.entries(value).every(([op, operand]) => {
          switch (op) {
            case '$gt':  return doc[key] > (operand as any);
            case '$gte': return doc[key] >= (operand as any);
            case '$lt':  return doc[key] < (operand as any);
            case '$lte': return doc[key] <= (operand as any);
            case '$ne':  return doc[key] !== (operand as any);
            case '$in':  return (operand as any[]).includes(doc[key]);
            case '$nin': return !(operand as any[]).includes(doc[key]);
            case '$contains': return String(doc[key]).toLowerCase().includes(String(operand as any).toLowerCase());
            case '$exists': return (operand as any) ? key in doc : !(key in doc);
            default: return false;
          }
        });
      }
      return doc[key] === value;
    });
  }
}