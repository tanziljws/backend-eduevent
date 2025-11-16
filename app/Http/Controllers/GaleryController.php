<?php

namespace App\Http\Controllers;

use App\Models\Galery;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class GaleryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $galeries = Galery::with(['post'])->get();
        return response()->json([
            'success' => true,
            'data' => $galeries
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'post_id' => 'required|exists:posts,id',
            'position' => 'required|integer|min:1',
            'status' => 'required|integer|in:0,1'
        ]);

        $galery = Galery::create($request->all());
        $galery->load(['post']);

        return response()->json([
            'success' => true,
            'message' => 'Galery berhasil dibuat',
            'data' => $galery
        ], Response::HTTP_CREATED);
    }

    /**
     * Display the specified resource.
     */
    public function show(Galery $galery)
    {
        $galery->load(['post']);
        return response()->json([
            'success' => true,
            'data' => $galery
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Galery $galery)
    {
        $request->validate([
            'post_id' => 'required|exists:posts,id',
            'position' => 'required|integer|min:1',
            'status' => 'required|integer|in:0,1'
        ]);

        $galery->update($request->all());
        $galery->load(['post']);

        return response()->json([
            'success' => true,
            'message' => 'Galery berhasil diupdate',
            'data' => $galery
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Galery $galery)
    {
        $galery->delete();
        return response()->json([
            'success' => true,
            'message' => 'Galery berhasil dihapus'
        ]);
    }
}
