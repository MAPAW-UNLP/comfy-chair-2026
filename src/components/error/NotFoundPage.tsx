import { Link } from "@tanstack/react-router";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { useAuth } from "@/contexts/AuthContext";

export default function NotFoundPage() {
    const {user} = useAuth();
  return (
    <Card className="mx-auto sm:mt-20 w-full max-w-md ">
        <CardHeader>
            <CardTitle>404 - Página no encontrada</CardTitle>
        </CardHeader>
        <CardContent>
            <CardDescription>
                La página que estás buscando no existe o ha sido movida.
            </CardDescription>
        </CardContent>
        <CardFooter>
            <Link to={user ? "/dashboard" : "/"} className="w-full">
                <Button className="w-full cursor-pointer">Volver al inicio</Button>
            </Link>
        </CardFooter>
    </Card>
  )
}