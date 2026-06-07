import { Button } from '../../components/ui';
import { PlusIcon } from '../../components/icons';
import { RoomCard } from './RoomCard';
import { makeNewRoom } from './room';
import type { PaintingComputation } from '../../lib/estimate/painting';
import type { Room } from '../../lib/types';

interface PaintingCalculatorProps {
  rooms: Room[];
  computation: PaintingComputation;
  onChange: (rooms: Room[]) => void;
}

export function PaintingCalculator({ rooms, computation, onChange }: PaintingCalculatorProps) {
  const update = (index: number, room: Room) =>
    onChange(rooms.map((r, i) => (i === index ? room : r)));
  const remove = (index: number) => onChange(rooms.filter((_, i) => i !== index));
  const add = () => onChange([...rooms, makeNewRoom(`Room ${rooms.length + 1}`)]);

  return (
    <div className="space-y-3">
      {rooms.map((room, i) => (
        <RoomCard
          key={room.id}
          room={room}
          index={i}
          canRemove={rooms.length > 1}
          computation={computation.rooms[i]}
          onChange={(r) => update(i, r)}
          onRemove={() => remove(i)}
        />
      ))}
      <Button variant="secondary" fullWidth leftIcon={<PlusIcon size={18} />} onClick={add}>
        Add room
      </Button>
    </div>
  );
}
