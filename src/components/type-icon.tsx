import {
  Bell,
  Cake,
  Flower2,
  Gem,
  GraduationCap,
  Handshake,
  type LucideIcon,
  Paperclip,
  PartyPopper,
  Pin,
  Plane,
  Star,
} from "lucide-react";
import type { EventType } from "@/lib/types";

const TYPE_ICONS: Record<EventType, LucideIcon> = {
  birthday: Cake,
  anniversary: Gem,
  special_day: Star,
  important_day: Pin,
  death_day: Flower2,
  exam: GraduationCap,
  meeting: Handshake,
  trip: Plane,
  festival: PartyPopper,
  reminder: Bell,
  other: Paperclip,
};

export function TypeIcon({
  type,
  size = 20,
  className,
  style,
}: {
  type: EventType;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const Icon = TYPE_ICONS[type];
  return <Icon size={size} className={className} style={style} />;
}
