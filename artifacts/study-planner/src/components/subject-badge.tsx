import { Badge } from "@/components/ui/badge";
import { Subject } from "@workspace/api-client-react";

interface SubjectBadgeProps {
  subject?: Subject | null;
  className?: string;
}

export function SubjectBadge({ subject, className }: SubjectBadgeProps) {
  if (!subject) return null;
  
  return (
    <Badge 
      variant="outline" 
      className={`gap-1 ${className}`}
      style={{
        backgroundColor: `${subject.color}15`,
        borderColor: `${subject.color}40`,
        color: subject.color,
      }}
    >
      <div 
        className="w-2 h-2 rounded-full" 
        style={{ backgroundColor: subject.color }} 
      />
      {subject.name}
    </Badge>
  );
}
