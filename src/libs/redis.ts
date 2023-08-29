import { promisify } from 'util'
import { createClient, RedisClientOptions } from 'redis'

const options: RedisClientOptions = {
  url: process.env.REDIS_URI,
  // password: '',
  disableOfflineQueue: false,
  legacyMode: true,
  database: 0
}

export const redisClient = createClient(options)

// client.on('connect', () => {
//   // console.log('Client connected to redis...');
// });

// client.on('ready', () => {
//   // console.log('Client connected to redis and ready to use...');
// });

// client.on('error', (err) => {
//   console.log(err.message);
// });

// client.on('end', () => {
//   console.log('Client disconnected from redis');
// });

// process.on('SIGINT', () => {
//   client.quit();
// });
// client.connect().catch((e) => console.log(e));

export const getRedisAsync = promisify(redisClient.get).bind(redisClient)
export const setRedisAsync = promisify(redisClient.set).bind(redisClient)
export const flushRedisAsync = promisify(redisClient.FLUSHDB).bind(redisClient)
export const flushRedisAsyncx = promisify(redisClient.hGetAll).bind(redisClient)
export const remRedisAsync = promisify(redisClient.DEL).bind(redisClient)

// ** Cache **
export const cacheManager = (key: string) => {
  return {
    save: async (data: any): Promise<void> => {
      if (!data) return
      try {
        await setRedisAsync(`sports:${key}`, JSON.stringify(data))
      } catch (error) {
        throw error
      }
    },
    get: async <T>(): Promise<T> => {
      try {
        return JSON.parse(await getRedisAsync(`sports:${key}`))
      } catch (error) {
        throw error
      }
    },
    remove: async (): Promise<void> => {
      try {
        await remRedisAsync(`sports:${key}`)
      } catch (error) {
        throw error
      }
    }
  }
}
