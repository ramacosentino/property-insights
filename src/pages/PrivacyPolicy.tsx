import UrbbanLogo from "@/components/UrbbanLogo";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link to="/" className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <UrbbanLogo size="sm" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Política de Privacidad</h1>
          <p className="text-muted-foreground mt-2">Última actualización: 12 de marzo de 2026</p>
        </div>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Introducción</h2>
          <p className="text-muted-foreground leading-relaxed">
            En Urbanna ("nosotros", "nuestro" o "la Plataforma"), nos comprometemos a proteger la privacidad de nuestros usuarios. Esta Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos su información personal cuando utiliza nuestros servicios de análisis inmobiliario.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Información que recopilamos</h2>
          <p className="text-muted-foreground leading-relaxed">Recopilamos los siguientes tipos de información:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-2">
            <li><strong className="text-foreground">Información de cuenta:</strong> nombre, dirección de correo electrónico y datos de autenticación al registrarse.</li>
            <li><strong className="text-foreground">Datos obtenidos de Google:</strong> al iniciar sesión con Google, accedemos únicamente a su nombre, dirección de correo electrónico y foto de perfil (scopes: <code>email</code>, <code>profile</code>, <code>openid</code>). No accedemos, almacenamos ni compartimos ningún otro dato de su cuenta de Google.</li>
            <li><strong className="text-foreground">Datos de uso:</strong> interacciones con la plataforma, búsquedas realizadas, propiedades guardadas y preferencias de filtros.</li>
            <li><strong className="text-foreground">Información de suscripción:</strong> datos relacionados con su plan y estado de pago (procesados a través de terceros).</li>
            <li><strong className="text-foreground">Datos técnicos:</strong> dirección IP, tipo de navegador, sistema operativo y datos de cookies.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. Uso de la información</h2>
          <p className="text-muted-foreground leading-relaxed">Utilizamos su información para:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-2">
            <li>Proveer y mejorar nuestros servicios de análisis inmobiliario.</li>
            <li>Personalizar su experiencia y recomendaciones.</li>
            <li>Enviar notificaciones y alertas configuradas por usted.</li>
            <li>Gestionar su cuenta y suscripción.</li>
            <li>Cumplir con obligaciones legales y regulatorias.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Uso de datos de Google</h2>
          <p className="text-muted-foreground leading-relaxed">
            Cuando inicia sesión con Google, Urbanna accede únicamente a su nombre, correo electrónico y foto de perfil para crear y gestionar su cuenta. Estos datos:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-2">
            <li><strong className="text-foreground">Acceso:</strong> se obtienen una única vez durante el inicio de sesión.</li>
            <li><strong className="text-foreground">Uso:</strong> se utilizan exclusivamente para identificarlo dentro de la plataforma y personalizar su experiencia.</li>
            <li><strong className="text-foreground">Almacenamiento:</strong> se almacenan de forma segura en nuestros servidores con cifrado en tránsito y en reposo.</li>
            <li><strong className="text-foreground">Compartición:</strong> no se comparten, venden ni transfieren a terceros bajo ninguna circunstancia.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            El uso de datos recibidos de APIs de Google se adhiere a la{" "}
            <a href="https://developers.google.com/terms/api-services-user-data-policy#limited-use" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">
              Política de Uso Limitado de Google API Services
            </a>
            . No utilizamos datos de Google para publicidad, perfilado de terceros ni ningún propósito fuera de los descritos en esta política.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Compartición de datos</h2>
          <p className="text-muted-foreground leading-relaxed">
            No vendemos ni compartimos su información personal con terceros con fines comerciales. Podemos compartir datos con:
          </p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-2">
            <li><strong className="text-foreground">Proveedores de servicios:</strong> procesadores de pago, servicios de autenticación y alojamiento en la nube, exclusivamente para operar la plataforma.</li>
            <li><strong className="text-foreground">Autoridades legales:</strong> cuando sea requerido por ley o para proteger nuestros derechos.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Almacenamiento y seguridad</h2>
          <p className="text-muted-foreground leading-relaxed">
            Su información se almacena en servidores seguros con cifrado en tránsito y en reposo. Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos contra acceso no autorizado, alteración o destrucción.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">7. Cookies</h2>
          <p className="text-muted-foreground leading-relaxed">
            Utilizamos cookies esenciales para el funcionamiento de la plataforma (autenticación y preferencias de sesión). No utilizamos cookies de rastreo publicitario de terceros.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">8. Sus derechos</h2>
          <p className="text-muted-foreground leading-relaxed">Usted tiene derecho a:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-2 pl-2">
            <li>Acceder a sus datos personales.</li>
            <li>Solicitar la corrección de datos inexactos.</li>
            <li>Solicitar la eliminación de su cuenta y datos asociados.</li>
            <li>Revocar su consentimiento en cualquier momento.</li>
            <li>Presentar una queja ante la autoridad de protección de datos correspondiente.</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            En cumplimiento con la Ley N° 25.326 de Protección de Datos Personales de Argentina, puede ejercer estos derechos contactándonos a través de los medios indicados al final de este documento.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">9. Retención de datos</h2>
          <p className="text-muted-foreground leading-relaxed">
            Conservamos sus datos personales mientras mantenga una cuenta activa o según sea necesario para prestarle servicios. Puede solicitar la eliminación de su cuenta en cualquier momento desde la sección de Configuración.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">10. Cambios a esta política</h2>
          <p className="text-muted-foreground leading-relaxed">
            Nos reservamos el derecho de modificar esta Política de Privacidad. Notificaremos cambios significativos por correo electrónico o mediante un aviso en la plataforma. El uso continuado tras la notificación constituye aceptación de los cambios.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">11. Contacto</h2>
          <p className="text-muted-foreground leading-relaxed">
            Para consultas sobre esta política o para ejercer sus derechos, contáctenos en:
          </p>
          <p className="text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Email:</strong> privacidad@urbanna.co
          </p>
        </section>

        <div className="border-t border-border pt-6 text-center">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Urbanna. Todos los derechos reservados.</p>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
