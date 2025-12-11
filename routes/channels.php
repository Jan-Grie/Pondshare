<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('pond.{pondId}', function ($user, $pondId) {
    $pond = \App\Models\Pond::find($pondId);
    return $pond && $pond->user_id === $user->id;
});
