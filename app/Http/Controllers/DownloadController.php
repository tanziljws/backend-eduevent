<?php

namespace App\Http\Controllers;

use App\Models\Download;
use App\Models\Galery;
use App\Models\Foto;
use Illuminate\Http\Request;

class DownloadController extends Controller
{
    public function download(Request $request, Galery $galery, Foto $foto)
    {
        if ($foto->galery_id !== $galery->id) {
            abort(404);
        }

        Download::create([
            'galery_id' => $galery->id,
            'user_id' => auth('user')->id() ?? auth()->id(),
            'ip' => $request->ip(),
            'user_agent' => substr((string) $request->userAgent(), 0, 255),
        ]);

        $path = public_path('storage/'.$foto->file);
        if (!file_exists($path)) {
            $alt = public_path($foto->file);
            if (file_exists($alt)) {
                $path = $alt;
            }
        }

        if (!file_exists($path)) {
            abort(404);
        }

        return response()->download($path);
    }
}
