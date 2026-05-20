/** A plain document stored in GmailDB */
export interface GmailDBDocument {
  /** Gmail message ID */
  id: string;
  /** GmailDB unique document ID */
  _id: string;
  [key: string]: any;
}

/** Result of an insert operation */
export interface InsertResult {
  /** GmailDB unique document ID */
  id: string;
  /** Gmail message ID */
  msgId: string;
  /** The inserted document */
  data: GmailDBDocument;
}

/** Result of an insertMany operation */
export interface InsertManyResult {
  /** Number of documents inserted */
  inserted: number;
  /** Array of GmailDB document IDs */
  ids: string[];
}

/** Result of a delete operation */
export interface DeleteResult {
  /** Number of documents deleted */
  deleted: number;
}

/** Options for find() */
export interface FindOptions {
  /** Maximum number of documents to return */
  limit?: number;
  /** Number of documents to skip */
  skip?: number;
  /** Sort options */
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  };
  /** Only return these fields */
  fields?: string[];
}

/** Options for insert() */
export interface InsertOptions {
  /** Auto-delete after this many days */
  ttl?: number;
}

/** An uploaded file result */
export interface UploadResult {
  /** Gmail message ID of the uploaded file */
  id: string;
  /** Original filename */
  filename: string;
}

/** A downloaded file */
export interface FileResult {
  /** File contents as Buffer */
  data: Buffer;
  /** Original filename */
  filename: string;
  /** MIME type */
  mimeType: string;
}
export interface AggregateResult {
  value: any;
  count: number;
}