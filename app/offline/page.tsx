"use client";

import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="mb-8">
          <svg
            className="mx-auto h-24 w-24 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          You&apos;re Offline
        </h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          It looks like you&apos;ve lost your internet connection. Please check your
          network settings and try again.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Try Again
          </button>
          <p className="text-sm text-gray-500">
            Or browse our{" "}
            <Link href="/" className="text-green-600 hover:text-green-700">
              cached pages
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
