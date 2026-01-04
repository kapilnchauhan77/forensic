import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  TouchSensor,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { DragDropPuzzle as DragDropPuzzleData } from '../../data/learningCases';

interface DraggableItemProps {
  id: string;
  label: string;
  image?: string;
  isPlaced: boolean;
}

function DraggableItem({ id, label, image, isPlaced }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled: isPlaced,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  if (isPlaced) {
    return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        p-3 rounded-lg border-2 cursor-grab active:cursor-grabbing
        transition-all duration-200
        ${isDragging
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-lg scale-105 z-50'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-600'
        }
      `}
    >
      {image && (
        <img
          src={image}
          alt={label}
          className="w-16 h-16 object-contain mx-auto mb-2 pointer-events-none"
        />
      )}
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center pointer-events-none">
        {label}
      </p>
    </div>
  );
}

interface DropZoneProps {
  id: string;
  label: string;
  image?: string;
  placedItem: { id: string; label: string; image?: string } | null;
  isCorrect: boolean | null;
}

function DropZone({ id, label, image, placedItem, isCorrect }: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[120px] p-4 rounded-lg border-2 border-dashed
        transition-all duration-200 flex flex-col items-center justify-center
        ${isOver
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
          : placedItem
            ? isCorrect === true
              ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
              : isCorrect === false
                ? 'border-red-500 bg-red-50 dark:bg-red-900/30'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
            : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
        }
      `}
    >
      {image && !placedItem && (
        <img
          src={image}
          alt={label}
          className="w-12 h-12 object-contain mb-2 opacity-50"
        />
      )}
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 text-center mb-2">
        {label}
      </p>
      {placedItem ? (
        <div className="p-2 rounded bg-white dark:bg-gray-700 shadow-sm">
          {placedItem.image && (
            <img
              src={placedItem.image}
              alt={placedItem.label}
              className="w-12 h-12 object-contain mx-auto mb-1"
            />
          )}
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
            {placedItem.label}
          </p>
        </div>
      ) : (
        <p className="text-xs text-gray-400 dark:text-gray-500">Drop here</p>
      )}
    </div>
  );
}

interface DragDropPuzzleProps {
  data: DragDropPuzzleData;
  onComplete: (success: boolean) => void;
  hints?: string[];
}

export default function DragDropPuzzle({ data, onComplete, hints }: DragDropPuzzleProps) {
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Check if dropping on a valid drop zone
      const dropZone = data.dropZones.find(z => z.id === over.id);
      if (dropZone) {
        // Remove item from any previous placement
        const newPlacements = { ...placements };
        Object.keys(newPlacements).forEach(key => {
          if (newPlacements[key] === active.id) {
            delete newPlacements[key];
          }
        });
        // Place in new zone
        newPlacements[over.id as string] = active.id as string;
        setPlacements(newPlacements);
      }
    }
  };

  const checkAnswers = () => {
    setShowResult(true);
    const allCorrect = data.dropZones.every(zone =>
      placements[zone.id] === zone.correctItemId
    );

    setTimeout(() => {
      onComplete(allCorrect);
    }, 1500);
  };

  const resetPuzzle = () => {
    setPlacements({});
    setShowResult(false);
    setShowHint(false);
  };

  const activeItem = data.items.find(item => item.id === activeId);
  const allPlaced = data.dropZones.every(zone => placements[zone.id]);

  const getPlacedItem = (zoneId: string) => {
    const itemId = placements[zoneId];
    if (!itemId) return null;
    return data.items.find(item => item.id === itemId) || null;
  };

  const isZoneCorrect = (zoneId: string): boolean | null => {
    if (!showResult) return null;
    const zone = data.dropZones.find(z => z.id === zoneId);
    if (!zone) return null;
    return placements[zoneId] === zone.correctItemId;
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <p className="text-lg font-medium text-gray-900 dark:text-white">
          {data.question}
        </p>

        {/* Items to drag */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Drag items to their correct positions:
          </p>
          <div className="flex flex-wrap gap-3">
            {data.items.map(item => (
              <DraggableItem
                key={item.id}
                id={item.id}
                label={item.label}
                image={item.image}
                isPlaced={Object.values(placements).includes(item.id)}
              />
            ))}
          </div>
        </div>

        {/* Drop zones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.dropZones.map(zone => (
            <DropZone
              key={zone.id}
              id={zone.id}
              label={zone.label}
              image={zone.image}
              placedItem={getPlacedItem(zone.id)}
              isCorrect={isZoneCorrect(zone.id)}
            />
          ))}
        </div>

        {/* Hints */}
        {hints && hints.length > 0 && !showResult && (
          <div className="mt-4">
            {showHint ? (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {hints[0]}
                </p>
              </div>
            ) : (
              <button
                onClick={() => setShowHint(true)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              >
                Need a hint?
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={checkAnswers}
            disabled={!allPlaced || showResult}
            className={`
              px-6 py-2 rounded-lg font-medium transition-all
              ${allPlaced && !showResult
                ? 'bg-primary-600 text-white hover:bg-primary-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
              }
            `}
          >
            Check Answer
          </button>
          <button
            onClick={resetPuzzle}
            className="px-6 py-2 rounded-lg font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            Reset
          </button>
        </div>
      </div>

      <DragOverlay>
        {activeItem ? (
          <div className="p-3 rounded-lg border-2 border-primary-500 bg-white dark:bg-gray-800 shadow-lg">
            {activeItem.image && (
              <img
                src={activeItem.image}
                alt={activeItem.label}
                className="w-16 h-16 object-contain mx-auto mb-2"
              />
            )}
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
              {activeItem.label}
            </p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
