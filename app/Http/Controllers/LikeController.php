<?php

namespace App\Http\Controllers;

use App\Models\Galery;
use App\Models\Like;
use Illuminate\Http\Request;

class LikeController extends Controller
{
    public function toggle(Request $request, Galery $galery)
    {
        $userId = auth('user')->id() ?? auth()->id();
        if (!$userId) {
            return redirect()->route('user.login');
        }

        $existing = Like::where('user_id', $userId)->where('galery_id', $galery->id)->first();
        if ($existing) {
            $existing->delete();
            session()->flash('success', 'Galeri berhasil dihapus dari suka.');
        } else {
            Like::create(['user_id' => $userId, 'galery_id' => $galery->id]);
            session()->flash('success', 'Galeri berhasil ditambahkan ke suka!');
        }

        if ($request->wantsJson()) {
            $count = Like::where('galery_id', $galery->id)->count();
            return response()->json(['likes' => $count]);
        }

        return back();
    }
}
