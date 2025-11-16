import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Globe, Send, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import Footer from '../components/Footer';

function Contact() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
      } else {
        console.error('Error:', data);
        alert(data.message || 'Gagal mengirim pesan');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat mengirim pesan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-4 py-12">
      {/* simple centered content without outer frame */}
      <div className="w-full max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
            {/* Left text block */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="pr-0 md:pr-8"
            >
              <p className="tracking-widest text-[11px] font-semibold text-blue-600">WE'RE HERE TO HELP</p>
              <h1 className="mt-2 text-[30px] md:text-[38px] font-extrabold text-gray-900 leading-tight">
                Diskusikan
                <br className="hidden md:block" />
                Kebutuhan Event Anda
              </h1>
              <p className="mt-3 text-[13px] md:text-sm text-gray-600 max-w-md">Ingin mengelola event dan sertifikat dengan rapi? Kirimkan pesan, kami akan bantu sesuai kebutuhan Anda.</p>
              <div className="mt-6 space-y-2.5">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">support@edufest.app</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">+62 812-0000-0000</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Indonesia</span>
                </div>
              </div>
            </motion.div>

            {/* Right form card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="w-full"
            >
              <Card className="bg-white shadow-none border-none rounded-2xl ring-1 ring-gray-100">
                <CardContent className="p-6 sm:p-7">
                  {success ? (
                  <motion.div 
                    className="text-center py-8"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <motion.div 
                      className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                    >
                      <Send className="w-8 h-8 text-green-600" />
                    </motion.div>
                    <motion.h3 
                      className="text-xl font-semibold text-green-600 mb-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 }}
                    >
                      Pesan Terkirim!
                    </motion.h3>
                    <motion.p 
                      className="text-gray-600 mb-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 }}
                    >
                      Terima kasih atas pesan Anda. Tim kami akan merespons dalam 1x24 jam.
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.7 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        onClick={() => setSuccess(false)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Kirim Pesan Lain
                      </Button>
                    </motion.div>
                  </motion.div>
              ) : (
                <motion.form 
                  onSubmit={handleSubmit} 
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, staggerChildren: 0.1 }}
                >
                  <motion.div 
                    className="grid grid-cols-1 gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    >
                      <label className="block text-sm font-medium text-gray-800 mb-1.5">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Masukkan nama lengkap"
                        required
                        className="w-full h-11 bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 rounded-lg"
                      />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      <label className="block text-sm font-medium text-gray-800 mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="nama@email.com"
                        required
                        className="w-full h-11 bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500 rounded-lg"
                      />
                    </motion.div>
                  </motion.div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-1.5">
                        Subjek <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full h-11 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Pilih subjek</option>
                        <option value="Informasi Kegiatan">Informasi Kegiatan</option>
                        <option value="Pendaftaran Event">Pendaftaran Event</option>
                        <option value="Sertifikat">Sertifikat</option>
                        <option value="Kerjasama">Kerjasama</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1.5">
                      Pesan <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tulis pesan Anda di sini..."
                      required
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-full"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Mengirim...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                            <ArrowRight className="w-4 h-4" />
                          </span>
                          <span>Kirim Pesan</span>
                        </div>
                      )}
                    </Button>
                  </motion.div>
                </motion.form>
              )}
                <div className="border-t border-gray-200 pt-3 mt-3">
                  <p className="text-sm text-gray-600">
                    * Untuk keperluan mendesak di luar jam operasional, 
                    silakan hubungi via WhatsApp
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Contact;
