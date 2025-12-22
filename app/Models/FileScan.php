<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FileScan extends Model
{

    protected $table = 'file_scan_events';
    protected $fillable = [
        'file_id',
        'status',
        'message',
    ];

    public function file()
    {
        return $this->belongsTo(File::class);
    }
}
