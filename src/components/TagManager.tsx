import { useState } from "react";
import { useTags, TAG_COLORS, type TagColor } from "@/hooks/useTags";
import { Tag as TagIcon, Plus, X, Edit2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface TagBadgeProps {
  tagId: string;
  showRemove?: boolean;
  onRemove?: () => void;
}

export function TagBadge({ tagId, showRemove = false, onRemove }: TagBadgeProps) {
  const { getTagById } = useTags();
  const tag = getTagById(tagId);

  if (!tag) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{
        backgroundColor: `${tag.color}20`,
        color: tag.color,
        border: `1px solid ${tag.color}40`,
      }}
    >
      <TagIcon className="w-3 h-3" />
      {tag.name}
      {showRemove && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:opacity-70 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

interface TagBadgesProps {
  tagIds: string[];
  onRemove?: (tagId: string) => void;
}

export function TagBadges({ tagIds, onRemove }: TagBadgesProps) {
  const { getTagsByIds } = useTags();
  const tags = getTagsByIds(tagIds);

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <TagBadge
          key={tag.id}
          tagId={tag.id}
          showRemove={!!onRemove}
          onRemove={onRemove ? () => onRemove(tag.id) : undefined}
        />
      ))}
    </div>
  );
}

interface TagManagerProps {
  projectId?: string;
  attachedTagIds?: string[];
  onTagsChange?: (tagIds: string[]) => void;
  compact?: boolean;
}

export function TagManager({ projectId, attachedTagIds = [], onTagsChange, compact = false }: TagManagerProps) {
  const { tags, addTag, removeTag, updateTag } = useTags();
  const [isAdding, setIsAdding] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [selectedColor, setSelectedColor] = useState<TagColor>(TAG_COLORS[0]);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingColor, setEditingColor] = useState<TagColor>(TAG_COLORS[0]);

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    await addTag(newTagName.trim(), selectedColor);
    setNewTagName("");
    setIsAdding(false);
    setSelectedColor(TAG_COLORS[0]);
  };

  const handleEditTag = (tagId: string) => {
    const tag = tags.find((t) => t.id === tagId);
    if (tag) {
      setEditingTagId(tagId);
      setEditingName(tag.name);
      setEditingColor(tag.color as TagColor);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTagId || !editingName.trim()) return;
    await updateTag(editingTagId, { name: editingName.trim(), color: editingColor });
    setEditingTagId(null);
    setEditingName("");
    setEditingColor(TAG_COLORS[0]);
  };

  const handleCancelEdit = () => {
    setEditingTagId(null);
    setEditingName("");
    setEditingColor(TAG_COLORS[0]);
  };

  const ColorPicker = ({ selected, onSelect }: { selected: TagColor; onSelect: (color: TagColor) => void }) => (
    <div className="flex gap-1.5 flex-wrap max-w-[180px]">
      {TAG_COLORS.map((color) => (
        <Tooltip key={color} delayDuration={0}>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onSelect(color)}
              className={`w-5 h-5 rounded-full transition-all hover:scale-110 ${
                selected === color ? "ring-2 ring-white ring-offset-2 ring-offset-[#0b0b0b]" : ""
              }`}
              style={{ backgroundColor: color }}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>{color}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {attachedTagIds.map((tagId) => {
          const tag = tags.find((t) => t.id === tagId);
          if (!tag) return null;
          return (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
              style={{
                backgroundColor: `${tag.color}20`,
                color: tag.color,
              }}
            >
              <TagIcon className="w-3 h-3" />
              {tag.name}
            </span>
          );
        })}
        {isAdding ? (
          <div className="flex items-center gap-1">
            <Input
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              placeholder="Tag..."
              className="h-6 w-20 text-xs"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              onKeyDown={(e) => e.key === "Escape" && setIsAdding(false)}
            />
            <button onClick={handleAddTag} className="text-[#C4A264] hover:text-[#C4A264]/80">
              <Check className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs text-[#F0EAE0]/40 border border-dashed border-[#F0EAE0]/20 hover:border-[#C4A264]/50 hover:text-[#C4A264] transition-colors"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((tag) => (
        <div
          key={tag.id}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all group"
          style={{
            backgroundColor: `${tag.color}20`,
            color: tag.color,
            border: `1px solid ${tag.color}40`,
          }}
        >
          <TagIcon className="w-3 h-3" />
          {editingTagId === tag.id ? (
            <>
              <Input
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="h-4 w-20 text-xs bg-transparent border-none p-0 focus:ring-0"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                onKeyDown={(e) => e.key === "Escape" && handleCancelEdit()}
              />
              <div className="flex items-center gap-1 ml-1">
                <ColorPicker selected={editingColor} onSelect={setEditingColor} />
                <button onClick={handleSaveEdit} className="hover:opacity-70">
                  <Check className="w-3 h-3" />
                </button>
                <button onClick={handleCancelEdit} className="hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </>
          ) : (
            <>
              <span className="font-medium">{tag.name}</span>
              <div className="flex items-center gap-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditTag(tag.id)}
                  className="hover:opacity-70"
                  title="Modifier"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeTag(tag.id)}
                  className="hover:opacity-70"
                  title="Supprimer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div
                className="w-2 h-2 rounded-full ml-1"
                style={{ backgroundColor: tag.color }}
              />
            </>
          )}
        </div>
      ))}

      {isAdding ? (
        <div className="flex items-center gap-2 p-2 border border-dashed border-[#C4A264]/30 rounded-lg bg-black/20">
          <Input
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="Nom du tag..."
            className="h-8 w-32 text-xs"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
          />
          <ColorPicker selected={selectedColor} onSelect={setSelectedColor} />
          <Button size="sm" onClick={handleAddTag} className="h-8 bg-[#C4A264] text-black hover:bg-[#C4A264]/90">
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsAdding(false)} className="h-8">
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

// Color palette preview component for settings/display
export function ColorPalette() {
  return (
    <div className="flex gap-2">
      {TAG_COLORS.map((color) => (
        <div
          key={color}
          className="w-6 h-6 rounded-full border border-white/20"
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}