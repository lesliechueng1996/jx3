import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RaidSlotIndicatorsComponent } from './RaidSlotIndicatorsComponent';
import type { SignupDraft } from './raid-run-form-schema';
import { ROLE_CELL_CLASSES, ROLE_LABELS, slotKey } from './role-slot-utils';

type RaidGridComponentProps = {
  signups: SignupDraft[];
  selected: { groupNumber: number; positionNumber: number } | null;
  disabled?: boolean;
  onSelect: (groupNumber: number, positionNumber: number) => void;
};

export function RaidGridComponent({
  signups,
  selected,
  disabled = false,
  onSelect,
}: RaidGridComponentProps) {
  const signupMap = new Map(
    signups.map((signup) => [
      slotKey(signup.groupNumber, signup.positionNumber),
      signup,
    ]),
  );

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[repeat(5,1fr)] gap-2 text-center text-xs font-medium text-muted-foreground">
        {[1, 2, 3, 4, 5].map((groupNumber) => (
          <div key={`group-header-${groupNumber}`}>{groupNumber} 队</div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }, (_, positionIndex) => {
          const positionNumber = positionIndex + 1;

          return Array.from({ length: 5 }, (_, groupIndex) => {
            const groupNumber = groupIndex + 1;
            const signup = signupMap.get(slotKey(groupNumber, positionNumber));
            const isSelected =
              selected?.groupNumber === groupNumber &&
              selected?.positionNumber === positionNumber;

            if (!signup) {
              return null;
            }

            return (
              <button
                key={slotKey(groupNumber, positionNumber)}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(groupNumber, positionNumber)}
                className={cn(
                  'relative flex min-h-16 flex-col items-start justify-between rounded-md border p-2 text-left transition-colors',
                  ROLE_CELL_CLASSES[signup.role],
                  isSelected && 'ring-2 ring-primary ring-offset-2',
                  disabled && 'cursor-not-allowed opacity-60',
                )}
              >
                <div className="flex w-full items-start justify-between gap-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {ROLE_LABELS[signup.role]}
                  </Badge>
                  <RaidSlotIndicatorsComponent
                    isLeader={signup.isLeader}
                    isDarkRun={signup.isDarkRun}
                    isFormationCore={signup.isFormationCore}
                  />
                </div>
                <span className="line-clamp-2 text-xs font-medium">
                  {signup.characterName?.trim() || '空位'}
                </span>
              </button>
            );
          });
        }).flat()}
      </div>
    </div>
  );
}
