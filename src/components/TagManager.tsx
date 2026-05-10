import { useState } from "react";
import { useTags } from "@/hooks/useTags";
import { Tag as TagIcon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TAG_COLORS = [
  "#C4A264", // Gold
  "#10B981", // Green
  "#EF4444", // Red
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#F59E0B", // Orange
  "#EC4899", // Pink
  "#06B6D4", // Cyan
];

export function TagManager({ projectId }: { projectId?: string }) {
  const { tags, addTag, removeTag } = useTags();
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState(TAG_COLORS[0]);

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    await addTag(newTagName.trim(), selectedColor);
    setNewTagName("");
    setIsAdding(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
          style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
        >
          <TagIcon className="w-3 h-3" />
          {tag.name}
          <button
            onClick={() => removeTag(tag.id)}
            className="hover:opacity-70"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {isAdding ? (
        <div className="flex items-center gap-2">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Nom du tag..."
            className="h-7 w-32 text-xs"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
          />
          <div className="flex gap-1">
            {TAG_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-4 h-4 rounded-full ${selectedColor === color ? "ring-2 ring-white" : ""}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
          <Button size="sm" onClick={handleAddTag} className="h-7 bg-[#C4A264] text-black">
            Ajouter
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-7">
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-[#F0EAE0]/50 border border-dashed border-[#F0EAE0]/20 hover:border-[#C4A264]/50 hover:text-[#C4A264] transition-colors"
        >
          <Plus className="w-3 h-3" />
          Ajouter un tag
        </button>
      )}
    </div>
  );
}