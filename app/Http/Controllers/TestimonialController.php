<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use App\Models\Testimonial;
use Illuminate\Support\Facades\Validator;

class TestimonialController extends Controller
{
    /**
     * Store a newly created testimonial
     */
    public function store(Request $request)
    {
        try {
            // Pastikan user login (route sudah dilindungi middleware auth:user)
            $user = Auth::guard('user')->user();

            // Validasi input termasuk reCAPTCHA
            $validator = Validator::make($request->all(), [
                'pesan' => 'required|string|max:1000',
                'g-recaptcha-response' => 'required',
            ], [
                'pesan.required' => 'Pesan wajib diisi.',
                'pesan.max' => 'Pesan maksimal 1000 karakter.',
                'g-recaptcha-response.required' => 'Verifikasi CAPTCHA wajib diisi.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validasi gagal',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify reCAPTCHA
            try {
                $verify = Http::asForm()->post(config('services.recaptcha.verify_url'), [
                    'secret' => config('services.recaptcha.secret_key'),
                    'response' => $request->input('g-recaptcha-response'),
                    'remoteip' => $request->ip(),
                ])->json();

                if (!($verify['success'] ?? false)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Verifikasi CAPTCHA gagal.',
                        'errors' => ['g-recaptcha-response' => ['Verifikasi CAPTCHA gagal.']]
                    ], 422);
                }
            } catch (\Exception $e) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tidak dapat memverifikasi CAPTCHA.',
                    'errors' => ['g-recaptcha-response' => ['Tidak dapat memverifikasi CAPTCHA.']]
                ], 422);
            }

            // Create testimonial
            $testimonial = Testimonial::create([
                'nama' => $user->name ?? $user->username ?? 'User',
                'email' => $user->email ?? '-',
                'pesan' => $request->pesan,
                'status' => 'pending'
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Testimoni berhasil dikirim! Menunggu persetujuan admin.',
                'data' => $testimonial
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Testimonial store error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menyimpan testimoni.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get approved testimonials for public display
     */
    public function getApproved()
    {
        $testimonials = Testimonial::approved()
            ->orderBy('created_at', 'desc')
            ->limit(6)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $testimonials
        ]);
    }

    /**
     * Admin: Get all testimonials with pagination
     */
    public function index(Request $request)
    {
        $query = Testimonial::query();

        // Filter by status
        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        // Search by name or email
        if ($request->has('search') && $request->search !== '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nama', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $testimonials = $query->orderBy('created_at', 'desc')->paginate(10);

        return view('admin.testimonials.index', compact('testimonials'));
    }

    /**
     * Admin: Update testimonial status
     */
    public function updateStatus(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:pending,approved,rejected'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Status tidak valid',
                    'errors' => $validator->errors()
                ], 422);
            }

            $testimonial = Testimonial::findOrFail($id);
            $testimonial->update(['status' => $request->status]);

            return response()->json([
                'success' => true,
                'message' => 'Status testimonial berhasil diperbarui',
                'data' => $testimonial
            ]);
        } catch (\Exception $e) {
            \Log::error('Testimonial updateStatus error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat memperbarui status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Admin: Delete testimonial
     */
    public function destroy($id)
    {
        try {
            $testimonial = Testimonial::findOrFail($id);
            $testimonial->delete();

            return response()->json([
                'success' => true,
                'message' => 'Testimonial berhasil dihapus'
            ]);
        } catch (\Exception $e) {
            \Log::error('Testimonial destroy error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat menghapus testimonial',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
