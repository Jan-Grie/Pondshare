<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordIsChanged
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {

        $user = $request->user();

        if (
            $user &&
            $user->must_change_password &&
            !$request->routeIs('password.force') &&
            !$request->routeIs('password.force.update') &&
            !$request->routeIs('logout')
        ) {
            return redirect()->route('password.force');
        }
        return $next($request);
    }
}
