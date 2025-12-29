'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Wand2, Loader2 } from 'lucide-react';

interface WizardOption {
  label: string;
  description: string;
  value: string;
}

interface WizardQuestion {
  id: string;
  question: string;
  header: string;
  options: WizardOption[];
  multiSelect: boolean;
}

interface WizardQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: WizardQuestion | null;
  questionIndex: number;
  totalQuestions: number;
  featureId: string;
  projectPath: string;
  onSubmit: (questionId: string, answer: string | string[]) => Promise<void>;
}

export function WizardQuestionModal({
  open,
  onOpenChange,
  question,
  questionIndex,
  totalQuestions,
  featureId,
  projectPath,
  onSubmit,
}: WizardQuestionModalProps) {
  const [selectedValue, setSelectedValue] = useState<string>('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset selection when question changes
  useEffect(() => {
    setSelectedValue('');
    setSelectedValues([]);
  }, [question?.id]);

  if (!question) return null;

  const handleSubmit = async () => {
    if (!question) return;

    setIsSubmitting(true);
    try {
      const answer = question.multiSelect ? selectedValues : selectedValue;
      await onSubmit(question.id, answer);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasSelection = question.multiSelect ? selectedValues.length > 0 : selectedValue !== '';

  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      setSelectedValues((prev) => [...prev, value]);
    } else {
      setSelectedValues((prev) => prev.filter((v) => v !== value));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Wand2 className="h-4 w-4 text-cyan-500" />
            </div>
            <div>
              <DialogTitle className="flex items-center gap-2">
                <span>{question.header}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Question {questionIndex + 1} of {totalQuestions}
                </span>
              </DialogTitle>
            </div>
          </div>
          <DialogDescription className="text-left mt-2">{question.question}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {question.multiSelect ? (
            // Multi-select with checkboxes
            <div className="space-y-3">
              {question.options.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    selectedValues.includes(option.value)
                      ? 'border-cyan-500 bg-cyan-500/5'
                      : 'border-border hover:border-cyan-500/50'
                  )}
                  onClick={() =>
                    handleCheckboxChange(option.value, !selectedValues.includes(option.value))
                  }
                >
                  <Checkbox
                    id={option.value}
                    checked={selectedValues.includes(option.value)}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(option.value, checked === true)
                    }
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Single-select with radio buttons
            <RadioGroup value={selectedValue} onValueChange={setSelectedValue}>
              <div className="space-y-3">
                {question.options.map((option) => (
                  <div
                    key={option.value}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                      selectedValue === option.value
                        ? 'border-cyan-500 bg-cyan-500/5'
                        : 'border-border hover:border-cyan-500/50'
                    )}
                    onClick={() => setSelectedValue(option.value)}
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="mt-0.5" />
                    <div className="flex-1">
                      <Label htmlFor={option.value} className="font-medium cursor-pointer">
                        {option.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">{option.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={handleSubmit}
            disabled={!hasSelection || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Continue'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
