import express from 'express'
import type { Request, Response } from 'express'
import { readFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const authRouter = express.Router()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const USERS_FILE = path.resolve(__dirname, '../../resources/users.json')
const JWT_SECRET = process.env.JWT_SECRET ?? 'changeme-set-JWT_SECRET-in-env'
const JWT_EXPIRES_IN = '24h'

interface User {
  username: string
  passwordHash: string
}

function loadUsers(): User[] {
  try {
    return JSON.parse(readFileSync(USERS_FILE, 'utf-8')) as User[]
  } catch {
    return []
  }
}

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body as { username?: string; password?: string }

  if (!username || !password) {
    res.status(400).json({ error: 'username and password are required' })
    return
  }

  const users = loadUsers()
  const user = users.find((u) => u.username === username)

  // Run bcrypt even when the user is not found to prevent timing attacks
  const hashToCompare = user?.passwordHash ?? '$2b$12$invalidhashtopreventtimingattack00000000000'
  const valid = await bcrypt.compare(password, hashToCompare)

  if (!user || !valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const token = jwt.sign({ sub: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
  res.json({ token })
})
