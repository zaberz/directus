import type {Driver, Range} from '@directus/storage';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import COS from 'cos-nodejs-sdk-v5'
import {normalizePath} from "@directus/utils";

export type DriverTencentConfig = {
  root: string;
  secretId: string,
  secretKey: string,
  bucket: string;
  region: string;
  endPoint: string
};

export class DriverTencent implements Driver {
  private root: string;
  private config: DriverTencentConfig;
  private client: COS;
  private bucket: string
  private region: string

  constructor(config: DriverTencentConfig) {
    this.config = config;

    this.root = this.config.root ? normalizePath(this.config.root, { removeLeading: true }) : '';
    this.client = this.getClient();
    this.bucket = config.bucket
    this.region = config.region
  }

  private getClient() {
    return new COS({
      SecretId: this.config.secretId,
      SecretKey: this.config.secretKey,
    })
  }

  private fullPath(filepath: string) {
    return normalizePath(join(this.root, filepath));
  }

  async read(filepath: string, range?: Range) {
    const options: any = {
      Bucket: this.bucket,
      Region: this.region,
      Key: this.fullPath(filepath)
    }

    if (range) {
      options.Range = `bytes=${range.start ?? ''}-${range.end ?? ''}`;
    }

    const res = await this.client.getObject(options)
    return Readable.from(res.Body);
  }

  async stat(filepath: string) {
    const statRes = await this.client.headObject({
      Bucket: this.bucket,
      Region: this.region,
      Key: this.fullPath(filepath)
    })

    if (!statRes) {
      throw new Error(`File "${filepath}" doesn't exist.`);
    }

    return {
      size: statRes.headers?.['content-length'],
      modified: statRes.headers?.['last-modified'],
    };
  }

  async exists(filepath: string) {
    try {
      await this.stat(filepath);
      return true;
    } catch {
      return false;
    }
  }

  async move(src: string, dest: string) {
    await this.copy(src, dest);
    await this.delete(src);
  }

  async copy(src: string, dest: string) {
    const fullSrc = this.fullPath(src);
    const fullDest = this.fullPath(dest);

    await this.client.putObjectCopy({
      Bucket: this.bucket,
      Region: this.region,
      Key: fullDest,
      CopySource: fullSrc
    })
  }

  async write(filepath: string, content: Readable) {
    const fullPath = this.fullPath(filepath);

    await this.client.putObject({
      Bucket: this.bucket,
      Region: this.region,
      Key: fullPath,
      Body: content
    })
  }

  async delete(filepath: string) {
    const fullPath = this.fullPath(filepath);

    await this.client.deleteObject({
      Bucket: this.bucket,
      Region: this.region,
      Key: fullPath,
    })
  }

  async *list(prefix = '') {
    const fullPrefix = this.fullPath(prefix);

    const fileList = await  this.client.getBucket({
      Bucket: this.bucket,
      Region: this.region,
      Prefix: fullPrefix,
      Delimiter: '/'
    })

    for (const file of fileList.Contents) {
      if (file.Key) {
        yield file.Key.substring(this.root.length);
      }
    }
  }

  // private async* listGenerator(prefix: string): AsyncGenerator<string> {
  //   const prefixDirectory = prefix.endsWith(sep) ? prefix : dirname(prefix);
  //
  //   const directory = await opendir(prefixDirectory);
  //
  //   for await (const file of directory) {
  //     const fileName = join(prefixDirectory, file.name);
  //
  //     if (fileName.toLowerCase().startsWith(prefix.toLowerCase()) === false) continue;
  //
  //     if (file.isFile()) {
  //       yield relative(this.root, fileName);
  //     }
  //
  //     if (file.isDirectory()) {
  //       yield* this.listGenerator(join(fileName, sep));
  //     }
  //   }
  // }
}

export default DriverTencent;
