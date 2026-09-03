import { createHash, randomBytes } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';
import { ApiKey } from './entities/api-key.entity.js';

const KEY_PREFIX = 'crm_live_';
// Shown in the UI to help recognize a key without ever exposing enough
// of it to be usable — the full raw key is only ever shown once, at
// creation time, and is never persisted anywhere.
const VISIBLE_PREFIX_LENGTH = KEY_PREFIX.length + 8;

function hash(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly apiKeysRepository: Repository<ApiKey>,
  ) {}

  async create(dto: CreateApiKeyDto, createdById: string): Promise<{ apiKey: ApiKey; rawKey: string }> {
    const rawKey = `${KEY_PREFIX}${randomBytes(24).toString('hex')}`;

    const entity = this.apiKeysRepository.create({
      name: dto.name,
      keyPrefix: rawKey.slice(0, VISIBLE_PREFIX_LENGTH),
      keyHash: hash(rawKey),
      createdById,
    });

    const saved = await this.apiKeysRepository.save(entity);
    const apiKey = await this.findById(saved.id);
    return { apiKey, rawKey };
  }

  findAll(): Promise<ApiKey[]> {
    return this.apiKeysRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findById(id: string): Promise<ApiKey> {
    const apiKey = await this.apiKeysRepository.findOne({ where: { id } });
    if (!apiKey) {
      throw new NotFoundException({ messageKey: 'integrations.keyNotFound' });
    }
    return apiKey;
  }

  async revoke(id: string): Promise<ApiKey> {
    await this.findById(id);
    await this.apiKeysRepository.update(id, { revoked: true });
    return this.findById(id);
  }

  /** Used by ApiKeyGuard on every integrations request — never by the UI. */
  async validateKey(rawKey: string): Promise<ApiKey | null> {
    const apiKey = await this.apiKeysRepository.findOne({
      where: { keyHash: hash(rawKey) },
    });
    if (!apiKey || apiKey.revoked) return null;

    await this.apiKeysRepository.update(apiKey.id, { lastUsedAt: new Date() });
    return apiKey;
  }
}
