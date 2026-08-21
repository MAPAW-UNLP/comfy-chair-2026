import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { Conference } from './ConferenceApp';
import type { Session } from '@/services/sessionServices';

type breadcrumbProps = {
  conference: Conference;
  session?: Session;
};

function ConferenceBreadcrumb({ conference, session }: breadcrumbProps) {
  return (
    <div>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/conference/view">
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />

          {session ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink href={`/conference/${conference.id}`}>
                  Conferencia
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />

              <BreadcrumbItem>
                <BreadcrumbPage className='font-bold'>Sesión</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage className='font-bold'>Conferencia</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

export default ConferenceBreadcrumb;
