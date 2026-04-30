import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadCSV, bulkUpload } from '../services/api';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  X,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    const csvFiles = acceptedFiles.filter(f => f.name.endsWith('.csv'));
    if (csvFiles.length !== acceptedFiles.length) {
      toast.error('Only CSV files are allowed');
    }
    setFiles(prev => [...prev, ...csvFiles]);
    setResults(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    multiple: true
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploading(true);
    setResults(null);

    try {
      if (files.length === 1) {
        const formData = new FormData();
        formData.append('file', files[0]);
        const response = await uploadCSV(formData);
        setResults(response.data);
        toast.success(response.data.message);
      } else {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        const response = await bulkUpload(formData);
        setResults(response.data);
        toast.success(`Processed ${response.data.totalFiles} files, ${response.data.totalInserted} records inserted`);
      }
      setFiles([]);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Upload Inquiries</h2>
        <p className="text-slate-500 mt-1">Upload TradeIndia CSV files to process and structure inquiry data</p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-slate-300 hover:border-slate-400 bg-white'
          }
        `}
      >
        <input {...getInputProps()} />
        <UploadCloud className={`w-12 h-12 mx-auto mb-4 ${isDragActive ? 'text-blue-500' : 'text-slate-400'}`} />
        <p className="text-lg font-medium text-slate-700">
          {isDragActive ? 'Drop files here' : 'Drag & drop CSV files here'}
        </p>
        <p className="text-sm text-slate-500 mt-1">or click to browse files</p>
        <p className="text-xs text-slate-400 mt-2">Supports TradeIndia export CSV format</p>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-slate-900 mb-3">Selected Files ({files.length})</h3>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-slate-700">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary w-full mt-4 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <UploadCloud className="w-5 h-5" />
                Upload {files.length} File{files.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="card border-green-200 bg-green-50">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <h3 className="font-semibold text-green-900">Upload Successful</h3>
          </div>

          {results.files ? (
            // Bulk upload results
            <div className="space-y-3">
              {results.files.map((file, index) => (
                <div key={index} className="p-3 bg-white rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">{file.filename}</span>
                    {file.error ? (
                      <span className="text-red-600 text-sm">{file.error}</span>
                    ) : (
                      <span className="text-green-600 text-sm font-medium">
                        {file.inserted} / {file.totalRows} inserted
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div className="pt-3 border-t border-green-200">
                <p className="text-green-800 font-medium">
                  Total: {results.totalInserted} records inserted across {results.totalFiles} files
                </p>
              </div>
            </div>
          ) : (
            // Single upload results
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-slate-900">{results.totalRows}</p>
                  <p className="text-xs text-slate-500">Total Rows</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{results.inserted}</p>
                  <p className="text-xs text-slate-500">Inserted</p>
                </div>
                <div className="text-center p-3 bg-white rounded-lg">
                  <p className="text-2xl font-bold text-amber-600">{results.errors?.length || 0}</p>
                  <p className="text-xs text-slate-500">Errors</p>
                </div>
              </div>
              {results.errors && results.errors.length > 0 && (
                <div className="mt-3 p-3 bg-amber-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800">Errors encountered:</span>
                  </div>
                  <ul className="text-xs text-amber-700 space-y-1">
                    {results.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>Row {err.row}: {err.error}</li>
                    ))}
                    {results.errors.length > 5 && (
                      <li>...and {results.errors.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="card">
        <h3 className="font-semibold text-slate-900 mb-3">Expected CSV Format</h3>
        <p className="text-sm text-slate-600 mb-3">
          Your TradeIndia CSV export should contain these columns:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Column</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Description</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="px-4 py-2 font-mono text-blue-600">Source</td>
                <td className="px-4 py-2 text-slate-600">Inquiry source type</td>
                <td className="px-4 py-2 text-slate-500">PHONE_INQUIRY</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-blue-600">Sender</td>
                <td className="px-4 py-2 text-slate-600">Person name</td>
                <td className="px-4 py-2 text-slate-500">Mr. Visram Kumhar</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-blue-600">Company Name</td>
                <td className="px-4 py-2 text-slate-600">Buyer company</td>
                <td className="px-4 py-2 text-slate-500">Hemi Chemical</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-blue-600">Requirement</td>
                <td className="px-4 py-2 text-slate-600">Inquiry text (product extracted from here)</td>
                <td className="px-4 py-2 text-slate-500">New Inquiry for Magnesium sulphate...</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-blue-600">Location</td>
                <td className="px-4 py-2 text-slate-600">City, State</td>
                <td className="px-4 py-2 text-slate-500">Jaipur, India</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-blue-600">Date/Time</td>
                <td className="px-4 py-2 text-slate-600">Inquiry date</td>
                <td className="px-4 py-2 text-slate-500">24 Feb 2026 10:46 AM</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-blue-600">EmailID</td>
                <td className="px-4 py-2 text-slate-600">Contact email</td>
                <td className="px-4 py-2 text-slate-500">visramvmpl@gmail.com</td>
              </tr>
              <tr>
                <td className="px-4 py-2 font-mono text-blue-600">Contact No</td>
                <td className="px-4 py-2 text-slate-600">Phone number</td>
                <td className="px-4 py-2 text-slate-500">919828724506</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Upload;
