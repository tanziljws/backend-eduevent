<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Foto;
use App\Models\Galery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FotoController extends Controller
{
    public function index()
    {
        $fotos = Foto::with('galery')->latest()->paginate(12);
        return view('admin.foto.index', compact('fotos'));
    }

    public function create()
    {
        $galeries = Galery::where('status', 1)->get();
        return view('admin.foto.create', compact('galeries'));
    }

    public function store(Request $request)
    {
        // Validasi fleksibel: support multiple (files[]), fallback single (file)
        $rules = [
            'galery_id' => 'required|exists:galery,id',
        ];
        // Jika multiple
        if ($request->hasFile('files')) {
            $rules['files'] = 'required';
            $rules['files.*'] = 'image|mimes:jpeg,png,jpg,gif';
        } else {
            $rules['file'] = 'required|image|mimes:jpeg,png,jpg,gif';
        }

        $validated = $request->validate($rules);

        // Multiple upload path
        if ($request->hasFile('files')) {
            $uploaded = 0;
            foreach ($request->file('files') as $idx => $file) {
                if (!$file->isValid()) continue;
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('fotos', $filename, 'public');

                Foto::create([
                    'galery_id' => $validated['galery_id'],
                    'file' => $path,
                ]);
                $uploaded++;
            }

            if ($request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'uploaded' => $uploaded,
                    'redirect' => route('admin.foto.index'),
                    'message' => $uploaded . ' foto berhasil diupload!'
                ]);
            }

            return redirect()->route('admin.foto.index')
                ->with('success', $uploaded . ' foto berhasil diupload!');
        }

        // Single upload fallback
        $file = $request->file('file');
        $filename = time() . '_' . $file->getClientOriginalName();
        $path = $file->storeAs('fotos', $filename, 'public');

        Foto::create([
            'galery_id' => $validated['galery_id'],
            'file' => $path,
        ]);

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'uploaded' => 1,
                'redirect' => route('admin.foto.index'),
                'message' => 'Foto berhasil diupload!'
            ]);
        }

        return redirect()->route('admin.foto.index')
            ->with('success', 'Foto berhasil diupload!');
    }

    public function show(Foto $foto)
    {
        $foto->load('galery');
        return view('admin.foto.show', compact('foto'));
    }

    public function edit(Foto $foto)
    {
        $galeries = Galery::where('status', 1)->get();
        return view('admin.foto.edit', compact('foto', 'galeries'));
    }

    public function update(Request $request, Foto $foto)
    {
        $request->validate([
            'galery_id' => 'required|exists:galery,id',
            'file' => 'nullable|image|mimes:jpeg,png,jpg,gif'
        ]);

        $data = $request->except('file');
        
        if ($request->hasFile('file')) {
            // Delete old file
            if ($foto->file && Storage::disk('public')->exists($foto->file)) {
                Storage::disk('public')->delete($foto->file);
            }
            
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('fotos', $filename, 'public');
            $data['file'] = $path;
        }

        $foto->update($data);

        return redirect()->route('admin.foto.index')
            ->with('success', 'Foto berhasil diupdate!');
    }

    public function destroy(Foto $foto)
    {
        // Delete file from storage
        if ($foto->file && Storage::disk('public')->exists($foto->file)) {
            Storage::disk('public')->delete($foto->file);
        }

        $foto->delete();

        return redirect()->route('admin.foto.index')
            ->with('success', 'Foto berhasil dihapus!');
    }
}
