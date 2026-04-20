// components/RichTextEditor.tsx
import React, { useRef, useEffect } from 'react';

// Quill is loaded from a CDN script, so we declare it to satisfy TypeScript.
interface QuillInstance {
    clipboard: { dangerouslyPasteHTML: (html: string, source?: string) => void };
    root: { innerHTML: string };
    on: (event: 'text-change', handler: (_delta: unknown, _oldDelta: unknown, source: string) => void) => void;
    container: HTMLDivElement;
}

declare const Quill: {
    new (element: HTMLDivElement, options: {
        modules: { toolbar: unknown[] };
        placeholder: string;
        theme: string;
    }): QuillInstance;
}; // External global

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder = "Viết nội dung của bạn ở đây..." }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const quillRef = useRef<QuillInstance | null>(null);
    const onChangeRef = useRef(onChange);
    const placeholderRef = useRef(placeholder);
    const valueRef = useRef(value);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        placeholderRef.current = placeholder;
    }, [placeholder]);

    useEffect(() => {
        valueRef.current = value;
    }, [value]);

    // This effect initializes the Quill editor. It runs only once.
    useEffect(() => {
        if (editorRef.current && !quillRef.current) {
            const toolbarOptions = [
                [{ 'header': [2, 3, false] }], // h2, h3
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['link', 'image'],
                ['blockquote', 'code-block'],
                ['clean']
            ];

            quillRef.current = new Quill(editorRef.current, {
                modules: {
                    toolbar: toolbarOptions,
                },
                placeholder: placeholderRef.current,
                theme: 'snow'
            });

            // Set initial content
            const quill = quillRef.current;
            quill.clipboard.dangerouslyPasteHTML(valueRef.current || '');

            // Add listener for text changes
            quill.on('text-change', (_delta: unknown, _oldDelta: unknown, source: string) => {
                if (source === 'user') {
                    onChangeRef.current(quill.root.innerHTML);
                }
            });
        }

        // Cleanup function to destroy the Quill instance
        return () => {
            if (quillRef.current && quillRef.current.container) {
                quillRef.current.container.innerHTML = ''; // Clean up DOM
            }
            quillRef.current = null;
        };
    }, []); // Empty dependency array ensures this effect runs only once on mount

    // This effect syncs the editor content if the `value` prop changes externally.
    useEffect(() => {
        const quill = quillRef.current;
        if (quill) {
            // Check if the content is different before updating to prevent infinite loops.
            if (value !== quill.root.innerHTML) {
                // It's safer to paste HTML to preserve formatting.
                // The 'silent' source prevents the 'text-change' event from firing and causing a loop.
                quill.clipboard.dangerouslyPasteHTML(value, 'silent');
            }
        }
    }, [value]);

    return (
        <div>
            <div ref={editorRef} />
        </div>
    );
};

export default RichTextEditor;
