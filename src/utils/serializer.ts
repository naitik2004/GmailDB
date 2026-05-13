export function serialize(data: any): string {
  try {
    return JSON.stringify(data, null, 2);
  } catch (err) {
    throw new Error('Failed to serialize data for Gmail storage.');
  }
}

export function deserialize(body: string): any {
  try {
    // Basic extraction from <pre> if exists
    const match = body.match(/<pre>([\s\S]*?)<\/pre>/);
    const jsonStr = match ? match[1] : body;
    return JSON.parse(jsonStr.trim());
  } catch (err) {
    console.warn('Failed to deserialize email body, returning raw string.');
    return body;
  }
}
