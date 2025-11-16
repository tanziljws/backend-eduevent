<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Galery;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function store(Request $request, Galery $galery)
    {
        $userId = auth('user')->id() ?? auth()->id();
        if (!$userId) {
            return redirect()->route('user.login');
        }

        $data = $request->validate([
            'body' => ['required', 'string', 'min:1'],
        ]);

        Comment::create([
            'galery_id' => $galery->id,
            'user_id' => $userId,
            'body' => $data['body'],
        ]);

        session()->flash('success', 'Komentar berhasil ditambahkan!');
        return back();
    }

    public function reply(Request $request, Comment $comment)
    {
        $userId = auth('user')->id() ?? auth()->id();
        if (!$userId) {
            return redirect()->route('user.login');
        }

        $data = $request->validate([
            'body' => ['required', 'string', 'min:1'],
        ]);

        Comment::create([
            'galery_id' => $comment->galery_id,
            'user_id' => $userId,
            'parent_id' => $comment->id,
            'body' => $data['body'],
        ]);

        session()->flash('success', 'Balasan berhasil ditambahkan!');
        return back();
    }

    public function destroy(Comment $comment)
    {
        $userId = auth('user')->id() ?? auth()->id();
        if (!$userId) {
            return redirect()->route('user.login');
        }

        if ($comment->user_id === (int) $userId) {
            $comment->delete();
            session()->flash('success', 'Komentar berhasil dihapus.');
        }

        return back();
    }
}
