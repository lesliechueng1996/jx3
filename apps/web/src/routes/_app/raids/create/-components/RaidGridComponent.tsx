import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { RaidSlotIndicatorsComponent } from './RaidSlotIndicatorsComponent';
import type { SignupDraft } from './raid-run-form-schema';
import { ROLE_CELL_CLASSES, ROLE_LABELS, slotKey } from './role-slot-utils';

type RaidGridComponentProps = {
  signups: SignupDraft[];
  selected: { groupNumber: number; positionNumber: number } | null;
  disabled?: boolean;
  serverNameById: Map<string, string>;
  kungfuIconById: Map<string, string | null>;
  onSelect: (groupNumber: number, positionNumber: number) => void;
  onSwap: (
    from: { groupNumber: number; positionNumber: number },
    to: { groupNumber: number; positionNumber: number },
  ) => void;
};

type RaidSlotComponentProps = {
  signup: SignupDraft;
  isSelected: boolean;
  disabled: boolean;
  characterName: string | null;
  serverName: string | undefined;
  kungfuIcon: string | null | undefined;
  isDragOverlay?: boolean;
  onSelect: () => void;
};

function RaidSlotDisplayName({
  characterName,
  serverName,
}: {
  characterName: string | null;
  serverName: string | undefined;
}) {
  const name = characterName?.trim();
  const server = serverName?.trim();

  if (!name) {
    return <span className="text-xs text-muted-foreground">空位</span>;
  }

  if (!server) {
    return <span className="text-sm font-medium leading-tight">{name}</span>;
  }

  return (
    <span className="line-clamp-2 leading-tight">
      <span className="text-sm font-medium">{name}</span>
      <span className="text-[10px] text-muted-foreground">·{server}</span>
    </span>
  );
}

function RaidSlotComponent({
  signup,
  isSelected,
  disabled,
  characterName,
  serverName,
  kungfuIcon,
  isDragOverlay = false,
  onSelect,
}: RaidSlotComponentProps) {
  const id = slotKey(signup.groupNumber, signup.positionNumber);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id,
      disabled,
    });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id,
    disabled,
  });

  const setRefs = (node: HTMLButtonElement | null) => {
    setNodeRef(node);
    setDropRef(node);
  };

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <button
      ref={setRefs}
      type="button"
      disabled={disabled}
      onClick={onSelect}
      style={style}
      {...listeners}
      {...attributes}
      className={cn(
        'relative flex min-h-16 flex-col items-start justify-between rounded-md border p-2 text-left transition-colors',
        ROLE_CELL_CLASSES[signup.role],
        isSelected && 'ring-2 ring-primary ring-offset-2',
        isOver && !isDragging && 'ring-2 ring-amber-500 ring-offset-1',
        isDragging && !isDragOverlay && 'opacity-40',
        isDragOverlay && 'shadow-lg ring-2 ring-primary ring-offset-2',
        disabled
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-grab active:cursor-grabbing',
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
      <div className="flex w-full items-end justify-between gap-1">
        <div className="min-w-0 flex-1">
          <RaidSlotDisplayName
            characterName={characterName}
            serverName={serverName}
          />
        </div>
        {kungfuIcon ? (
          <img
            src={kungfuIcon}
            alt=""
            className="size-5 shrink-0 rounded-sm object-cover"
          />
        ) : null}
      </div>
    </button>
  );
}

export function RaidGridComponent({
  signups,
  selected,
  disabled = false,
  serverNameById,
  kungfuIconById,
  onSelect,
  onSwap,
}: RaidGridComponentProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  const signupMap = new Map(
    signups.map((signup) => [
      slotKey(signup.groupNumber, signup.positionNumber),
      signup,
    ]),
  );

  const activeSignup = activeId ? signupMap.get(activeId) : undefined;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    const [fromGroup, fromPosition] = String(active.id).split('-').map(Number);
    const [toGroup, toPosition] = String(over.id).split('-').map(Number);

    if (
      !fromGroup ||
      !fromPosition ||
      !toGroup ||
      !toPosition ||
      Number.isNaN(fromGroup) ||
      Number.isNaN(fromPosition) ||
      Number.isNaN(toGroup) ||
      Number.isNaN(toPosition)
    ) {
      return;
    }

    onSwap(
      { groupNumber: fromGroup, positionNumber: fromPosition },
      { groupNumber: toGroup, positionNumber: toPosition },
    );
  };

  const renderSlot = (groupNumber: number, positionNumber: number) => {
    const signup = signupMap.get(slotKey(groupNumber, positionNumber));

    if (!signup) {
      return null;
    }

    const isSelected =
      selected?.groupNumber === groupNumber &&
      selected?.positionNumber === positionNumber;
    const serverName = signup.serverId
      ? serverNameById.get(signup.serverId)
      : undefined;
    const kungfuIcon = signup.kungfuId
      ? kungfuIconById.get(signup.kungfuId)
      : undefined;

    return (
      <RaidSlotComponent
        key={slotKey(groupNumber, positionNumber)}
        signup={signup}
        isSelected={isSelected}
        disabled={disabled}
        characterName={signup.characterName}
        serverName={serverName}
        kungfuIcon={kungfuIcon}
        onSelect={() => onSelect(groupNumber, positionNumber)}
      />
    );
  };

  return (
    <DndContext
      id="raid-grid-dnd"
      sensors={sensors}
      onDragStart={(event) => setActiveId(String(event.active.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
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
              return renderSlot(groupNumber, positionNumber);
            });
          }).flat()}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeSignup ? (
          <RaidSlotComponent
            signup={activeSignup}
            isSelected={false}
            disabled={false}
            characterName={activeSignup.characterName}
            serverName={
              activeSignup.serverId
                ? serverNameById.get(activeSignup.serverId)
                : undefined
            }
            kungfuIcon={
              activeSignup.kungfuId
                ? kungfuIconById.get(activeSignup.kungfuId)
                : undefined
            }
            isDragOverlay
            onSelect={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
