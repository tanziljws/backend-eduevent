<?php

namespace App\Http\Controllers;

use App\Models\Petugas;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class PetugasController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        try {
            Log::info('PetugasController@index called');
            $petugas = Petugas::all();
            
            Log::info('Petugas retrieved successfully', ['count' => $petugas->count()]);
            
            return response()->json([
                'success' => true,
                'data' => $petugas
            ]);
        } catch (\Exception $e) {
            Log::error('Error in PetugasController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil data petugas',
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
            Log::info('PetugasController@store called', ['request_data' => $request->all()]);
            
            $request->validate([
                'username' => 'required|string|max:255|unique:petugas',
                'password' => 'required|string|min:6'
            ]);

            $petugas = Petugas::create([
                'username' => $request->username,
                'password' => Hash::make($request->password)
            ]);

            Log::info('Petugas created successfully', ['petugas_id' => $petugas->id]);

            return response()->json([
                'success' => true,
                'message' => 'Petugas berhasil dibuat',
                'data' => $petugas
            ], Response::HTTP_CREATED);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Validation failed in PetugasController@store', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\Exception $e) {
            Log::error('Error in PetugasController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat membuat petugas',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Petugas $petugas)
    {
        try {
            Log::info('PetugasController@show called', ['petugas_id' => $petugas->id]);
            
            return response()->json([
                'success' => true,
                'data' => $petugas
            ]);
        } catch (\Exception $e) {
            Log::error('Error in PetugasController@show: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengambil data petugas',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Petugas $petugas)
    {
        try {
            Log::info('PetugasController@update called', [
                'petugas_id' => $petugas->id,
                'request_data' => $request->all()
            ]);
            
            $request->validate([
                'username' => 'required|string|max:255|unique:petugas,username,' . $petugas->id,
                'password' => 'nullable|string|min:6'
            ]);

            $data = ['username' => $request->username];
            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->password);
            }

            Log::info('Updating petugas with data', $data);

            $updateResult = $petugas->update($data);
            
            if (!$updateResult) {
                Log::warning('Petugas update failed', ['petugas_id' => $petugas->id]);
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal mengupdate petugas'
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            // Refresh model to get latest data from database
            $petugas->refresh();

            Log::info('Petugas updated successfully', [
                'petugas_id' => $petugas->id,
                'new_username' => $petugas->username,
                'updated_at' => $petugas->updated_at
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Petugas berhasil diupdate',
                'data' => $petugas
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Validation failed in PetugasController@update', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        } catch (\Exception $e) {
            Log::error('Error in PetugasController@update: ' . $e->getMessage(), [
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat mengupdate petugas',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Petugas $petugas)
    {
        try {
            Log::info('PetugasController@destroy called', ['petugas_id' => $petugas->id]);
            
            $petugasId = $petugas->id;
            $deleteResult = $petugas->delete();
            
            if (!$deleteResult) {
                Log::warning('Petugas delete failed', ['petugas_id' => $petugasId]);
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal menghapus petugas'
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }

            Log::info('Petugas deleted successfully', ['petugas_id' => $petugasId]);

            return response()->json([
                'success' => true,
                'message' => 'Petugas berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            Log::error('Error in PetugasController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menghapus petugas',
                'error' => $e->getMessage()
            ], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }
}
