import { AwsClient } from 'aws4fetch';
export class CloudflareD1 {
  constructor(
    private account: string,
    private database: string,
    private token: string,
  ) {}
  async query(sql: string, params: unknown[] = []) {
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${this.account}/d1/database/${this.database}/query`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql, params }),
      },
    );
    const j = (await r.json()) as any;
    if (!r.ok || !j.success)
      throw new Error(`D1 query failed: ${j.errors?.[0]?.message || r.status}`);
    return j.result?.[0];
  }
}
export class CloudflareR2 {
  private aws: AwsClient;
  constructor(
    account: string,
    key: string,
    secret: string,
    private bucket: string,
  ) {
    this.aws = new AwsClient({
      accessKeyId: key,
      secretAccessKey: secret,
      service: 's3',
      region: 'auto',
    });
    this.endpoint = `https://${account}.r2.cloudflarestorage.com`;
  }
  private endpoint: string;
  async exists(key: string) {
    const r = await this.aws.fetch(`${this.endpoint}/${this.bucket}/${key}`, { method: 'HEAD' });
    return r.ok;
  }
  async put(key: string, bytes: Uint8Array, metadata: Record<string, string>) {
    if (await this.exists(key)) return;
    const r = await this.aws.fetch(`${this.endpoint}/${this.bucket}/${key}`, {
      method: 'PUT',
      body: bytes as any,
      headers: {
        ...Object.fromEntries(Object.entries(metadata).map(([k, v]) => [`x-amz-meta-${k}`, v])),
      },
    });
    if (!r.ok) throw new Error(`R2 archive failed: ${r.status}`);
  }
}
