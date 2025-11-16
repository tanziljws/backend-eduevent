<?php

namespace App\Http\Controllers;

use App\Models\Galery;
use App\Models\Bookmark;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    public function toggle(Request $request, Galery $galery)
    {
        $userId = auth('user')->id() ?? auth()->id();
        if (!$userId) {
            return redirect()->route('user.login');
        }

        $existing = Bookmark::where('user_id', $userId)->where('galery_id', $galery->id)->first();
        if ($existing) {
            $existing->delete();
            session()->flash('success', 'Galeri berhasil dihapus dari simpanan.');
        } else {
            Bookmark::create(['user_id' => $userId, 'galery_id' => $galery->id]);
            session()->flash('success', 'Galeri berhasil disimpan!');
        }

        if ($request->wantsJson()) {
            $count = Bookmark::where('galery_id', $galery->id)->count();
            return response()->json(['bookmarks' => $count]);
        }

        return back();
    }
}
