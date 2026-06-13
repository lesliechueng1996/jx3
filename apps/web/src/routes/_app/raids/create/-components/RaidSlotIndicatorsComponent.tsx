import { Circle, Coins, Triangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type RaidSlotIndicatorsComponentProps = {
  isLeader: boolean;
  isDarkRun: boolean;
  isFormationCore: boolean;
  className?: string;
};

export function RaidSlotIndicatorsComponent({
  isLeader,
  isDarkRun,
  isFormationCore,
  className,
}: RaidSlotIndicatorsComponentProps) {
  if (!isLeader && !isDarkRun && !isFormationCore) {
    return null;
  }

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      aria-hidden={true}
    >
      {isLeader ? (
        <Triangle className="size-3 fill-red-500 text-red-500 rotate-180" />
      ) : null}
      {isDarkRun ? <Coins className="size-3 text-yellow-500" /> : null}
      {isFormationCore ? (
        <Circle className="size-2 fill-green-500 text-green-500" />
      ) : null}
    </div>
  );
}
