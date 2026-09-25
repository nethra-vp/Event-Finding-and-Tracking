import { MongoClient, type Db } from 'mongodb'

const uri = process.env.MONGODB_URI
const databaseName = process.env.MONGODB_DB ?? 'eventide'

let clientPromise: Promise<MongoClient> | undefined

export function getDatabase(): Promise<Db> {
  if (!uri) throw new Error('MONGODB_URI is not configured')
  clientPromise ??= new MongoClient(uri).connect()
  return clientPromise.then((client) => client.db(databaseName))
}