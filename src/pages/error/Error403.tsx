

const Error403 = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-4xl font-bold mb-4">Unauthorized</h1>
            <p className="text-lg text-gray-600">You do not have permission to access this page.</p>
        </div>
    )
}

export default Error403;