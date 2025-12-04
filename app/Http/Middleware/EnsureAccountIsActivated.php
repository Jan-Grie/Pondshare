<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EnsureAccountIsActivated
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        //If User is not active, log them out and redirect to login with message
        if ($user && !$user->active) {
            Auth::logout();

            return Inertia::render('auth/inactive')
                ->toResponse($request)
                ->setStatusCode(403);
        }

        return $next($request);
    }
}
