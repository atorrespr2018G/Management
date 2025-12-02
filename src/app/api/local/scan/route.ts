import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { createHash } from 'crypto'
import { ScanResult } from '@/types/scanner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { directoryPath } = body

    if (!directoryPath) {
      return NextResponse.json(
        { error: 'Directory path is required' },
        { status: 400 }
      )
    }

    console.log(`📁 Scanning directory: ${directoryPath}`)

    const fileStructure = await scanDirectory(directoryPath, directoryPath)

    if (!fileStructure) {
      return NextResponse.json(
        { error: 'Failed to scan directory. Path may not exist or be inaccessible.' },
        { status: 500 }
      )
    }

    const totalFiles = countFiles(fileStructure)
    const totalFolders = countFolders(fileStructure)

    console.log(`✅ Scan completed! Found ${totalFiles} files and ${totalFolders} folders`)

    const result: ScanResult = {
      data: fileStructure,
      metadata: {
        source: 'local',
        scannedAt: new Date().toISOString(),
        totalFiles,
        totalFolders,
      },
    }

    return NextResponse.json({
      success: true,
      ...result
    })
  } catch (error) {
    console.error('Error scanning local directory:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to scan directory' },
      { status: 500 }
    )
  }
}

async function scanDirectory(dirPath: string, rootPath: string): Promise<any> {
  console.log(`🔍 Scanning: ${dirPath}`)
  let stats
  try {
    stats = await fs.stat(dirPath)
    console.log(`✅ Stats retrieved for: ${dirPath}`)
  } catch (error) {
    console.error(`❌ Error accessing ${dirPath}:`, error)
    return null // Skip this file/directory
  }

  if (stats.isFile()) {
    const relativePath = path.relative(rootPath, dirPath)

    // Calculate file hash (SHA256) for content identification
    let fileHash: string | undefined
    try {
      const fileBuffer = await fs.readFile(dirPath)
      fileHash = createHash('sha256').update(fileBuffer).digest('hex')
    } catch (error) {
      console.warn(`⚠️ Could not calculate hash for ${dirPath}:`, error)
      // Continue without hash if file read fails (e.g., permission denied)
    }

    return {
      id: uuidv4(),
      type: 'file',
      name: path.basename(dirPath),
      fullPath: dirPath,
      relativePath: relativePath,
      size: stats.size,
      extension: path.extname(dirPath) || 'no extension',
      modifiedTime: stats.mtime.toISOString(),
      createdAt: stats.birthtime.toISOString(),
      hash: fileHash, // SHA256 hash of file content
      children: [],
      source: 'local',
    }
  }

  const entries = await fs.readdir(dirPath)
  console.log(`📂 Found ${entries.length} entries in: ${dirPath}`)
  const children = []

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry)
    console.log(`🔄 Processing entry: ${entry}`)
    try {
      const child = await scanDirectory(fullPath, rootPath)
      if (child) {
        // Only add if scanDirectory didn't return null
        children.push(child)
        console.log(`✅ Added child: ${entry}`)
      }
    } catch (error) {
      console.error(`Error scanning ${fullPath}:`, error)
    }
  }

  const relativePath = path.relative(rootPath, dirPath)
  return {
    id: uuidv4(),
    type: 'directory',
    name: path.basename(dirPath),
    fullPath: dirPath,
    relativePath: relativePath || '.',
    modifiedTime: stats.mtime.toISOString(),
    createdAt: stats.birthtime.toISOString(),
    children: children,
    source: 'local',
  }
}

function countFiles(node: any): number {
  if (node.type === 'file') return 1
  return node.children.reduce((sum: number, child: any) => sum + countFiles(child), 0)
}

function countFolders(node: any): number {
  if (node.type === 'file') return 0
  return node.children.reduce((sum: number, child: any) => sum + countFolders(child) + 1, 0)
}
