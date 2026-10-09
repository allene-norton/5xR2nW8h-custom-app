'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CHECK_RESULT_OPTIONS, type CheckResult } from '@/types';

interface CheckResultSelectProps {
  checkName: string;
  result?: CheckResult;
  onChange: (result: CheckResult) => void;
  /** Hides the "Result" label for tighter layouts. */
  compact?: boolean;
}

/** Text color for a result, matching how it is rendered in the report. */
export function checkResultTextClass(result?: CheckResult): string {
  switch (result) {
    case 'Cleared':
    case 'No Records Found':
      return 'text-green-700';
    case 'Records Found':
      return 'text-red-700';
    case 'Under Review':
    case 'Pending':
      return 'text-yellow-700';
    case 'Not Applicable':
      return 'text-gray-500';
    default:
      return 'text-gray-900';
  }
}

/**
 * Dropdown for a single check's result. The selected value is written straight
 * into the report, so results never have to be typed in by hand.
 */
export function CheckResultSelect({
  checkName,
  result,
  onChange,
  compact = false,
}: CheckResultSelectProps) {
  const selectId = `check-result-${checkName}`;

  return (
    <div className={compact ? '' : 'space-y-1'}>
      {!compact && (
        <Label
          htmlFor={selectId}
          className="text-xs font-medium text-gray-600"
        >
          Result
        </Label>
      )}
      <Select
        value={result ?? ''}
        onValueChange={(value) => onChange(value as CheckResult)}
      >
        <SelectTrigger
          id={selectId}
          className={`h-8 w-full text-xs ${checkResultTextClass(result)}`}
          aria-label={`Result for ${checkName}`}
        >
          <SelectValue placeholder="Select result" />
        </SelectTrigger>
        <SelectContent>
          {CHECK_RESULT_OPTIONS.map((option) => (
            <SelectItem key={option} value={option} className="text-xs">
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
