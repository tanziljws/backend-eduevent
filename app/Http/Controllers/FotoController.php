<?php

namespace App\Http\Controllers;

use App\Models\Foto;
use App\Models\Galery;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class FotoController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            Log::info('FotoController@index called');
            $fotos = Foto::with(['galery'])->get();
            Log::info('Fotos retrieved successfully', ['count' => $fotos->count()]);
            
            return response()->json([
                'success' => true,
                'data' => $fotos
            ]);
        } catch (\Exception $e) {
            Log::error('Error in FotoController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil data foto',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            Log::info('FotoController@store called', [
                'request_data' => $request->all(),
                'headers' => $request->headers->all(),
                'method' => $request->method(),
                'url' => $request->url()
            ]);

            // Validate request
            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'galery_id' => 'required|integer|exists:galery,id',
                'file' => 'required|string|max:255',
                'judul' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed', ['errors' => $validator->errors()]);
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            Log::info('Validation passed');

            // Check if galery exists
            $galery = Galery::find($request->galery_id);
            if (!$galery) {
                Log::warning('Galery not found', ['galery_id' => $request->galery_id]);
                return response()->json([
                    'success' => false,
                    'message' => 'Galery tidak ditemukan'
                ], Response::HTTP_NOT_FOUND);
            }

            Log::info('Galery found', ['galery' => $galery->toArray()]);

            // Create foto
            $fotoData = [
                'galery_id' => $request->galery_id,
                'file' => $request->file,
                'judul' => $request->judul
            ];

            Log::info('Creating foto with data', $fotoData);

            $foto = Foto::create($fotoData);

            Log::info('Foto created successfully', ['foto_id' => $foto->id, 'foto_data' => $foto->toArray()]);

            // Load relationship
            $foto->load(['galery']);

            Log::info('Foto loaded with galery relationship', ['foto_with_galery' => $foto->toArray()]);

            return response()->json([
                'success' => true,
                'message' => 'Foto berhasil dibuat',
                'data' => $foto
            ], Response::HTTP_CREATED);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation exception in FotoController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);

        } catch (\Exception $e) {
            Log::error('Error in FotoController@store: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat membuat foto',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Foto $foto)
    {
        try {
            Log::info('FotoController@show called', ['foto_id' => $foto->id]);
            $foto->load(['galery']);
            return response()->json([
                'success' => true,
                'data' => $foto
            ]);
        } catch (\Exception $e) {
            Log::error('Error in FotoController@show: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil data foto',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Foto $foto)
    {
        try {
            Log::info('FotoController@update called', ['foto_id' => $foto->id, 'request_data' => $request->all()]);
            
            // Validate request
            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
                'galery_id' => 'required|integer|exists:galery,id',
                'file' => 'required|string|max:255',
                'judul' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed in update', ['errors' => $validator->errors()]);
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }

            // Check if galery exists
            $galery = Galery::find($request->galery_id);
            if (!$galery) {
                Log::warning('Galery not found in update', ['galery_id' => $request->galery_id]);
                return response()->json([
                    'success' => false,
                    'message' => 'Galery tidak ditemukan'
                ], Response::HTTP_NOT_FOUND);
            }

            // Update foto
            $foto->update([
                'galery_id' => $request->galery_id,
                'file' => $request->file,
                'judul' => $request->judul
            ]);

            // Load relationship
            $foto->load(['galery']);

            Log::info('Foto updated successfully', ['foto_id' => $foto->id]);

            return response()->json([
                'success' => true,
                'message' => 'Foto berhasil diupdate',
                'data' => $foto
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation exception in FotoController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);

        } catch (\Exception $e) {
            Log::error('Error in FotoController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengupdate foto',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Foto $foto)
    {
        try {
            Log::info('FotoController@destroy called', ['foto_id' => $foto->id]);
            $fotoId = $foto->id;
            $foto->delete();

            Log::info('Foto deleted successfully', ['foto_id' => $fotoId]);

            return response()->json([
                'success' => true,
                'message' => 'Foto berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            Log::error('Error in FotoController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menghapus foto',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
