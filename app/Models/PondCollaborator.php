<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PondCollaborator extends Model
{
    protected $fillable = ['pond_id', 'user_id', 'permission'];

    public function pond(): BelongsTo
    {
        return $this->belongsTo(Pond::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
