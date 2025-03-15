'use client';

import React, { useState, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import FontSize from '@tiptap/extension-font-size';
import { 
  Button
} from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Input
} from '@/components/ui/input';
import {
  Label
} from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  Strikethrough, 
  List, 
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Video,
  Type,
  PaintBucket,
  RotateCcw,
  ChevronDown,
  Upload
} from 'lucide-react';

interface TiptapEditorProps {
  content: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface LinkDialogProps {
  isOpen: boolean;
  url: string;
  onClose: () => void;
  onConfirm: (url: string) => void;
  setUrl: (url: string) => void;
}

const LinkDialog: React.FC<LinkDialogProps> = ({ isOpen, url, onClose, onConfirm, setUrl }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add or Edit Link</DialogTitle>
          <DialogDescription>
            Enter the URL you want to link to
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="link-url">URL</Label>
            <Input 
              id="link-url" 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              placeholder="https://example.com"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(url)}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  content,
  onChange,
  placeholder,
  className,
}) => {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      Underline,
      FontSize,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline underline-offset-2 hover:text-blue-800',
        },
      }),
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-md max-w-full my-4',
        },
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Write your blog content here...',
      }),
    ],
    content: content,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return null;
  }

  // Font size options
  const fontSizes = [
    { title: 'Small', value: '12px' },
    { title: 'Normal', value: '16px' },
    { title: 'Medium', value: '20px' },
    { title: 'Large', value: '24px' },
    { title: 'Extra Large', value: '32px' },
  ];

  // Font color options
  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Gray', value: '#666666' },
    { name: 'Red', value: '#ff0000' },
    { name: 'Blue', value: '#0000ff' },
    { name: 'Green', value: '#008000' },
    { name: 'Yellow', value: '#ffff00' },
    { name: 'Purple', value: '#800080' },
    { name: 'Orange', value: '#ffa500' },
  ];

  // Link handling
  const handleLinkOpen = () => {
    setLinkUrl(editor.getAttributes('link').href || '');
    setShowLinkDialog(true);
  };

  const handleLinkSave = (url: string) => {
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      // Add https:// if not present
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href: formattedUrl }).run();
    }
    setShowLinkDialog(false);
  };

  // Image handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (readerEvent) => {
        const imageUrl = readerEvent.target?.result as string;
        editor.chain().focus().setImage({ src: imageUrl }).run();
      };
      
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
    }
  };

  // Video handling
  const handleVideoEmbed = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (readerEvent) => {
        const videoUrl = readerEvent.target?.result as string;
        // Create a video element with controls
        const videoHTML = `<div class="video-container my-4"><video src="${videoUrl}" controls class="max-w-full rounded-md"></video></div>`;
        editor.commands.insertContent(videoHTML);
      };
      
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
    }
  };

  // URL video embed
  const handleVideoUrl = () => {
    const url = window.prompt('Enter video URL (YouTube, Vimeo, etc.)');
    if (url) {
      let embedUrl = url;
      
      // Handle YouTube URLs
      if (url.includes('youtube.com/watch') || url.includes('youtu.be')) {
        const videoId = url.includes('youtube.com/watch') 
          ? new URL(url).searchParams.get('v')
          : url.split('/').pop();
        
        if (videoId) {
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      }
      
      // Handle Vimeo URLs
      if (url.includes('vimeo.com')) {
        const videoId = url.split('/').pop();
        if (videoId) {
          embedUrl = `https://player.vimeo.com/video/${videoId}`;
        }
      }

      const videoHTML = `<div class="video-container my-4 aspect-video"><iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen class="w-full h-full rounded-md"></iframe></div>`;
      editor.commands.insertContent(videoHTML);
    }
  };

  return (
    <div className="border rounded-md">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-1 border-b bg-slate-50">
        {/* Text style controls */}
        <div className="flex items-center border-r pr-1">
          <Button
            onClick={() => editor.chain().focus().toggleBold().run()}
            variant={editor.isActive('bold') ? "default" : "ghost"}
            size="icon"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            variant={editor.isActive('italic') ? "default" : "ghost"}
            size="icon"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            variant={editor.isActive('underline') ? "default" : "ghost"}
            size="icon"
            title="Underline"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            variant={editor.isActive('strike') ? "default" : "ghost"}
            size="icon"
            title="Strikethrough"
          >
            <Strikethrough className="h-4 w-4" />
          </Button>
        </div>

        {/* Font Size */}
        <div className="border-r pr-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1 px-2">
                <Type className="h-4 w-4" />
                Font Size
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {fontSizes.map((item) => (
                <DropdownMenuItem
                  key={item.value}
                  onClick={() => editor.chain().focus().setFontSize(item.value).run()}
                >
                  <span style={{ fontSize: item.value }}>{item.title}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem
                onClick={() => editor.chain().focus().unsetFontSize().run()}
              >
                Reset font size
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Text Color */}
        <div className="border-r pr-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" title="Text Color">
                <PaintBucket className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-2">
              <div className="grid grid-cols-4 gap-1">
                {colors.map((color) => (
                  <Button
                    key={color.value}
                    variant="outline"
                    className="w-8 h-8 p-0"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                    onClick={() => editor.chain().focus().setColor(color.value).run()}
                  />
                ))}
                <Button
                  variant="outline"
                  className="w-8 h-8 p-0 col-span-4 mt-1"
                  onClick={() => editor.chain().focus().unsetColor().run()}
                >
                  Reset
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Alignment */}
        <div className="flex items-center border-r pr-1">
          <Button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            variant={editor.isActive({ textAlign: 'left' }) ? "default" : "ghost"}
            size="icon"
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            variant={editor.isActive({ textAlign: 'center' }) ? "default" : "ghost"}
            size="icon"
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            variant={editor.isActive({ textAlign: 'right' }) ? "default" : "ghost"}
            size="icon"
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Lists */}
        <div className="flex items-center border-r pr-1">
          <Button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            variant={editor.isActive('bulletList') ? "default" : "ghost"}
            size="icon"
            title="Bullet List"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            variant={editor.isActive('orderedList') ? "default" : "ghost"}
            size="icon"
            title="Numbered List"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Links, Images, Videos */}
        <div className="flex items-center border-r pr-1">
          <Button
            onClick={handleLinkOpen}
            variant={editor.isActive('link') ? "default" : "ghost"}
            size="icon"
            title="Insert Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              title="Insert Image"
              onClick={() => imageInputRef.current?.click()}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
            <input
              type="file"
              className="hidden"
              ref={imageInputRef}
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" title="Insert Video">
                <Video className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={handleVideoUrl}>
                <LinkIcon className="mr-2 h-4 w-4" />
                <span>Embed from URL</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => videoInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                <span>Upload Video</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            type="file"
            className="hidden"
            ref={videoInputRef}
            accept="video/*"
            onChange={handleVideoEmbed}
          />
        </div>

        {/* Formatting control */}
        <Button 
          variant="ghost" 
          size="icon" 
          title="Clear Formatting"
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor Content */}
      <EditorContent 
        editor={editor} 
        className={`prose prose-slate max-w-none p-4 min-h-[200px] focus:outline-none ${className || ''}`} 
      />

      {/* Bubble menu for quick formatting */}
      {editor && (
        <BubbleMenu 
          editor={editor} 
          tippyOptions={{ duration: 100 }}
          className="bg-white shadow-lg border rounded-md flex overflow-hidden"
        >
          <Button
            onClick={() => editor.chain().focus().toggleBold().run()}
            variant={editor.isActive('bold') ? "default" : "ghost"}
            size="sm"
            className="px-2 py-1 h-8"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            variant={editor.isActive('italic') ? "default" : "ghost"}
            size="sm"
            className="px-2 py-1 h-8"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            variant={editor.isActive('underline') ? "default" : "ghost"}
            size="sm"
            className="px-2 py-1 h-8"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleLinkOpen}
            variant={editor.isActive('link') ? "default" : "ghost"}
            size="sm"
            className="px-2 py-1 h-8"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </BubbleMenu>
      )}

      {/* Link Dialog */}
      <LinkDialog 
        isOpen={showLinkDialog}
        url={linkUrl}
        setUrl={setLinkUrl}
        onClose={() => setShowLinkDialog(false)}
        onConfirm={handleLinkSave}
      />
    </div>
  );
};

export default TiptapEditor;