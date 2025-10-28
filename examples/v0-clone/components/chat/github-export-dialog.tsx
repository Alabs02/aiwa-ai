'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Github, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GitHubExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  chatId: string | null
  chatTitle?: string
}

export function GitHubExportDialog({
  open,
  onOpenChange,
  chatId,
  chatTitle,
}: GitHubExportDialogProps) {
  const [repoName, setRepoName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [error, setError] = useState('')
  const [requiresAuth, setRequiresAuth] = useState(false)

  // Generate default repo name from chat title or ID
  useEffect(() => {
    if (open && chatId) {
      const sanitizedTitle = chatTitle
        ? chatTitle
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50)
        : null

      const defaultName =
        sanitizedTitle || `v0-export-${chatId.substring(0, 8)}`
      setRepoName(defaultName)
      setDescription(`Exported from v0 chat`)
    }
  }, [open, chatId, chatTitle])

  const handleConnectGitHub = () => {
    setIsConnecting(true)
    // Redirect to GitHub OAuth
    window.location.href = '/api/github/auth'
  }

  const handleExport = async () => {
    if (!chatId || !repoName.trim()) return

    setIsExporting(true)
    setError('')
    setRequiresAuth(false)

    try {
      const response = await fetch('/api/github/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          repoName: repoName.trim(),
          description: description.trim() || undefined,
          isPrivate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresAuth) {
          setRequiresAuth(true)
        }
        throw new Error(data.error || 'Export failed')
      }

      setExportSuccess(true)
      setRepoUrl(data.repoUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export')
    } finally {
      setIsExporting(false)
    }
  }

  const handleClose = () => {
    if (!isExporting) {
      setExportSuccess(false)
      setError('')
      setRequiresAuth(false)
      setRepoUrl('')
      onOpenChange(false)
    }
  }

  const handleViewRepo = () => {
    if (repoUrl) {
      window.open(repoUrl, '_blank', 'noopener,noreferrer')
    }
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] glass border-white/10 bg-black/15 backdrop-blur-sm">
        {exportSuccess ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    Export Successful!
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Your code has been pushed to GitHub
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="glass-subtle rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Repository</span>
                </div>
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-400 hover:text-blue-300 underline break-all flex items-center gap-1"
                >
                  {repoUrl}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              <div className="text-sm text-muted-foreground">
                <p>✓ All files have been committed</p>
                <p>✓ Repository is {isPrivate ? 'private' : 'public'}</p>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleViewRepo} className="w-full">
                View on GitHub
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        ) : requiresAuth ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                  <Github className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Connect GitHub</DialogTitle>
                  <DialogDescription className="text-sm">
                    Connect your GitHub account to export code
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="glass-subtle rounded-lg p-4 space-y-2">
                <p className="text-sm">
                  You'll be redirected to GitHub to authorize this app. We'll
                  only request access to create and manage repositories.
                </p>
                <div className="text-xs text-muted-foreground space-y-1 mt-3">
                  <p>• Create repositories</p>
                  <p>• Commit code</p>
                  <p>• Manage your repositories</p>
                </div>
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button
                onClick={handleConnectGitHub}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Connect GitHub
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={handleClose}
                disabled={isConnecting}
                className="w-full"
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                  <Github className="h-6 w-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl">
                    Export to GitHub
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Create a new repository with your code
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="repoName" className="text-sm font-medium">
                  Repository Name
                </Label>
                <Input
                  id="repoName"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder="my-awesome-app"
                  disabled={isExporting}
                  className="glass-subtle border-white/10"
                />
                <p className="text-xs text-muted-foreground">
                  Use lowercase letters, numbers, and hyphens
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description (Optional)
                </Label>
                <Input
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A brief description of your project"
                  disabled={isExporting}
                  className="glass-subtle border-white/10"
                />
              </div>

              <div className="flex items-center justify-between glass-subtle rounded-lg p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="private" className="text-sm font-medium">
                    Private Repository
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only you can see this repository
                  </p>
                </div>
                <Switch
                  id="private"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                  disabled={isExporting}
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button
                onClick={handleExport}
                disabled={isExporting || !repoName.trim()}
                className="w-full"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Create Repository
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                onClick={handleClose}
                disabled={isExporting}
                className="w-full"
              >
                Cancel
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
