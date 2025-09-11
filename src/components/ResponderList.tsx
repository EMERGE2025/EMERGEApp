'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';

interface Responder {
  id: string;
  name: string;
  contact: string;
  specialization: string;
  status: 'available' | 'assigned' | 'unavailable';
  skills: string[];
  profileImage?: string;
}

interface ResponderItemProps {
  responder: Responder;
}

function ResponderItem({ responder }: ResponderItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: responder.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`bg-white p-4 rounded-lg shadow-md cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden">
          <Image
            src={responder.profileImage || '/profile.jpg'}
            alt={responder.name}
            width={48}
            height={48}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div>
          <h3 className="font-semibold">{responder.name}</h3>
          <p className="text-sm text-gray-600">{responder.specialization}</p>
          <p className="text-sm text-gray-600">{responder.contact}</p>
          <div className="flex flex-wrap gap-1 mt-1">
            {responder.skills.map((skill, index) => (
              <span key={index} className="text-xs bg-blue-100 px-2 py-1 rounded">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ResponderListProps {
  responders: Responder[];
}

export default function ResponderList({ responders }: ResponderListProps) {
  return (
    <div className="space-y-4">
      {responders.map((responder) => (
        <ResponderItem key={responder.id} responder={responder} />
      ))}
    </div>
  );
}