'use client';

import { useState } from 'react';
import { useAppStore } from '@/store/app-store';
import { Shield, AlertTriangle, Terminal, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export function NpmSecurityApprovalDialog() {
  const { pendingNpmSecurityApproval, resolveNpmSecurityApproval, setPendingNpmSecurityApproval } =
    useAppStore();
  const [selectedOption, setSelectedOption] = useState<string>('proceed-safe');
  const [rememberChoice, setRememberChoice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!pendingNpmSecurityApproval) return null;

  const { command, options } = pendingNpmSecurityApproval;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await resolveNpmSecurityApproval(
        pendingNpmSecurityApproval.id,
        selectedOption,
        rememberChoice
      );
    } catch (error) {
      console.error('[NpmSecurityApprovalDialog] Error submitting approval:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resolveNpmSecurityApproval(pendingNpmSecurityApproval.id, 'cancel', false);
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-green-500/10 text-green-500 border-green-500/20';
    }
  };

  return (
    <Dialog open={true} onOpenChange={() => handleCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-yellow-500" />
            npm Security Approval Required
          </DialogTitle>
          <DialogDescription>
            An agent is attempting to run a command that may pose security risks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Command Display */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Command</span>
              <span
                className={`text-xs px-2 py-0.5 rounded border ${getRiskBadgeColor(command.riskLevel)}`}
              >
                {command.riskLevel} risk
              </span>
            </div>
            <pre className="bg-muted p-3 rounded-lg text-sm font-mono overflow-x-auto">
              {command.original}
            </pre>
          </div>

          {/* Warning */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">Supply Chain Risk</p>
              <p className="text-muted-foreground">
                {command.type === 'high-risk-execute'
                  ? 'This command downloads and executes code from the npm registry. Malicious packages can steal credentials, modify files, or compromise your system.'
                  : 'Install scripts can execute arbitrary code with your user permissions during package installation.'}
              </p>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <span className="text-sm font-medium">Choose an action</span>
            <div className="space-y-2">
              {options.map((option) => (
                <label
                  key={option.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedOption === option.action
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="approval-option"
                    value={option.action}
                    checked={selectedOption === option.action}
                    onChange={() => setSelectedOption(option.action)}
                    className="mt-1"
                  />
                  <div>
                    <span className="font-medium">
                      {option.label}
                      {option.isRecommended && (
                        <span className="ml-2 text-xs text-green-500">(Recommended)</span>
                      )}
                    </span>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Remember Choice */}
          {selectedOption !== 'cancel' && selectedOption !== 'proceed-safe' && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberChoice}
                onChange={(e) => setRememberChoice(e.target.checked)}
              />
              <span className="text-sm">Remember this choice for this project</span>
            </label>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default NpmSecurityApprovalDialog;
