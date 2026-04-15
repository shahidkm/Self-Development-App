import React, { useRef, useState } from "react";
import { Upload, Loader2, X, ImagePlus } from "lucide-react";

const CLOUD_NAME = "dk8wc11kq";
const UPLOAD_PRESET = "Self-Development";

export default function CloudinaryUpload({ onUpload, currentUrl, label = "Upload Image", className = "", showPreview = true }) {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentUrl || null);
    const fileRef = useRef();

    async function handleFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const form = new FormData();
            form.append("file", file);
            form.append("upload_preset", UPLOAD_PRESET);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: form });
            const data = await res.json();
            if (!data.secure_url) throw new Error("Upload failed");
            setPreview(data.secure_url);
            onUpload(data.secure_url);
        } catch (err) {
            alert("Upload failed: " + err.message);
        } finally {
            setUploading(false);
            fileRef.current.value = "";
        }
    }

    function clear(e) {
        e.stopPropagation();
        setPreview(null);
        onUpload("");
    }

    return (
        <div className={`relative ${className}`}>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

            {showPreview && preview ? (
                <div className="relative group w-full">
                    <img src={preview} alt="uploaded" className="w-full h-32 object-cover rounded-xl border border-white/10" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                        <button type="button" onClick={() => fileRef.current.click()}
                            className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 transition-all">
                            <Upload size={14} />
                        </button>
                        <button type="button" onClick={clear}
                            className="p-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 transition-all">
                            <X size={14} />
                        </button>
                    </div>
                </div>
            ) : (
                <button type="button" onClick={() => fileRef.current.click()} disabled={uploading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-white/20 hover:border-cyan-500/40 text-slate-500 hover:text-cyan-400 transition-all text-sm disabled:opacity-50"
                    style={{ background: "rgba(15,23,42,0.5)" }}>
                    {uploading
                        ? <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                        : <><ImagePlus size={16} /> {label}</>
                    }
                </button>
            )}
        </div>
    );
}
