import { Link } from 'react-router-dom'

export default function Header() {
    return (
        <header className="bg-blue-600 text-white shadow-lg">
            <nav className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <Link to="/" className="text-2xl font-bold">
                        College Events Portal
                    </Link>
                    <ul className="flex space-x-6">
                        <li>
                            <Link to="/" className="hover:text-blue-200 transition">
                                Home
                            </Link>
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
    )
}