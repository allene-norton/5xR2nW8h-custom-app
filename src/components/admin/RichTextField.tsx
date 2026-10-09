'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { Bold, Italic, Underline as UnderlineIcon, Link as LinkIcon } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

interface RichTextFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (html: string) => void;
}

/**
 * A constrained rich-text editor for cover letter copy: bold, italic,
 * underline, links, and lists only — no headings, colors, images, or tables.
 * That's a deliberate ceiling, not a missing feature: it keeps every field
 * editable without being able to break the letter's layout or color coding,
 * and it keeps the editor's own output inside the vocabulary the server-side
 * sanitizer (sanitize-html.ts) allows, so nothing gets silently stripped
 * between what's shown here and what's saved.
 */
export function RichTextField({
  label,
  description,
  value,
  onChange,
}: RichTextFieldProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        blockquote: false,
        link: false, // using the standalone Link extension below instead
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[80px] rounded-b-md border border-t-0 border-gray-200 bg-white px-3 py-2 focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Keep the editor in sync when `value` changes from outside (e.g. a reset
  // or loading saved content), without fighting the user's own typing — only
  // push an external change in when it actually differs from what's there.
  useEffect(() => {
    if (!editor) return;
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previousUrl || 'https://');
    if (url === null) return; // cancelled
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  if (!editor) return null;

  return (
    <div className="space-y-1">
      <Label className="text-sm font-medium text-gray-900">{label}</Label>
      {description && <p className="text-xs text-gray-500">{description}</p>}
      <div>
        <div className="flex items-center gap-1 rounded-t-md border border-gray-200 bg-gray-50 p-1">
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Underline"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant={editor.isActive('link') ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 w-7 p-0"
            onClick={setLink}
            aria-label="Link"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
