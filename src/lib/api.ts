export const api = {
  async getStore(key: string) {
    const res = await fetch(`/api/store/${key}`);
    if (!res.ok) return null;
    return await res.json();
  },
  async setStore(key: string, value: any) {
    await fetch(`/api/store/${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(value)
    });
  },
  async getMarks() {
    const res = await fetch('/api/marks');
    if (!res.ok) return [];
    return await res.json();
  },
  async upsertMarks(marks: any[]) {
    await fetch('/api/marks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(marks)
    });
  }
};
