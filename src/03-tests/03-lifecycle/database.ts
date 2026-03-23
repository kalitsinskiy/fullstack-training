export interface Entity {
  id: string;
}

export class InMemoryDatabase<T extends Entity> {
  private store = new Map<string, T>();
  private _operationLog: string[] = [];

  insert(item: T): T {
    if (this.store.has(item.id)) {
      throw new Error(`Item with id '${item.id}' already exists`);
    }
    this.store.set(item.id, { ...item });
    this._operationLog.push(`INSERT:${item.id}`);
    return item;
  }

  update(id: string, changes: Partial<Omit<T, 'id'>>): T {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Item '${id}' not found`);
    const updated = { ...existing, ...changes } as T;
    this.store.set(id, updated);
    this._operationLog.push(`UPDATE:${id}`);
    return updated;
  }

  delete(id: string): boolean {
    const existed = this.store.has(id);
    this.store.delete(id);
    if (existed) this._operationLog.push(`DELETE:${id}`);
    return existed;
  }

  findById(id: string): T | undefined {
    const item = this.store.get(id);
    return item ? { ...item } : undefined;
  }

  findAll(): T[] {
    return [...this.store.values()].map(item => ({ ...item }));
  }

  count(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
    this._operationLog = [];
  }

  get operationLog(): string[] {
    return [...this._operationLog];
  }
}
