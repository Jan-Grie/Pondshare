<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PondDailyDownload extends Model
{
    use HasFactory;

    protected $fillable = [
        'pond_id',
        'date',
        'download_count',
    ];

    protected $casts = [
        'date' => 'date',
        'download_count' => 'integer',
    ];

    public function pond()
    {
        return $this->belongsTo(Pond::class);
    }
}
