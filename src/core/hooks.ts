export type HookFn = (data: any) => any | Promise<any>;

export class Hooks {
  private hooks: Map<string, HookFn[]> = new Map();

  register(event: string, fn: HookFn): void {
    if (!this.hooks.has(event)) this.hooks.set(event, []);
    this.hooks.get(event)!.push(fn);
  }

  async run(event: string, data: any): Promise<any> {
    const fns = this.hooks.get(event) || [];
    let result = data;
    for (const fn of fns) {
      result = await fn(result) ?? result;
    }
    return result;
  }

  clear(event?: string): void {
    if (event) this.hooks.delete(event);
    else this.hooks.clear();
  }
}